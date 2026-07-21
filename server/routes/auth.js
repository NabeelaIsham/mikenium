import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';
import {consumeRateLimit,rateLimit} from '../middleware/rate-limit.js';
import {env} from '../config/env.js';
const router=Router();

const loginSchema=z.object({email:z.string().trim().email().max(255),password:z.string().min(1).max(200)});
const cookieOptions={httpOnly:true,sameSite:'strict',secure:env.isProduction,path:'/'};
async function getSecuritySettings(){const {rows}=await pool.query('SELECT security FROM site_settings WHERE id=1');return {sessionMinutes:480,maxLoginAttempts:5,...rows[0]?.security}}
const logFailedLogin=(email,ip,reason)=>pool.query('INSERT INTO admin_audit_logs(action,ip_address,metadata) VALUES($1,$2,$3)',['SUPER_ADMIN_LOGIN_FAILED',ip,JSON.stringify({description:'Failed super admin login attempt',attemptedEmail:String(email||'').slice(0,255),reason})]);

// Public website authentication can never issue a SUPER_ADMIN session.
router.post('/login',rateLimit({scope:'user-login',limit:10,windowMs:15*60*1000,key:req=>`${req.ip}:${req.body?.email||''}`}),async(req,res)=>{
  const {email,password}=req.body;
  const {rows}=await pool.query('SELECT * FROM users WHERE lower(email)=lower($1) AND active=true',[email||'']);
  const user=rows[0];
  if(!user || user.role==='SUPER_ADMIN' || !(await bcrypt.compare(password||'',user.password_hash))) return res.status(401).json({message:'Invalid credentials'});
  res.json({message:'Login successful',user:{id:user.id,email:user.email,role:user.role}});
});

// Browser login for the single database-provisioned super-admin account.
router.post('/super-admin/login',async(req,res)=>{
  const security=await getSecuritySettings();
  const rate=await consumeRateLimit({scope:'super-admin-login',identifier:`${req.ip}:${req.body?.email||''}`,limit:security.maxLoginAttempts,windowMs:15*60*1000});
  if(!rate.allowed){res.set('Retry-After',String(Math.max(1,Math.ceil((rate.resetAt-Date.now())/1000))));await logFailedLogin(req.body?.email,req.ip,'Rate limited');return res.status(429).json({message:'Too many login attempts. Try again in 15 minutes.'});}
  const parsed=loginSchema.safeParse(req.body);
  if(!parsed.success){await logFailedLogin(req.body?.email,req.ip,'Invalid request');return res.status(400).json({message:'Enter a valid email and password'});}
  const {email,password}=parsed.data;
  const allowedEmail=(process.env.SUPER_ADMIN_EMAIL||'info@mikenium.com').toLowerCase();
  if(email.toLowerCase()!==allowedEmail){await logFailedLogin(email,req.ip,'Account not allowed');return res.status(401).json({message:'Invalid email or password'});}
  const {rows}=await pool.query("SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=lower($1) AND role='SUPER_ADMIN' AND active=true",[email]);
  const user=rows[0];
  if(!user || !(await bcrypt.compare(password,user.password_hash))){await logFailedLogin(email,req.ip,'Invalid credentials');return res.status(401).json({message:'Invalid email or password'});}
  await pool.query('UPDATE users SET last_login_at=now() WHERE id=$1',[user.id]);
  const expiresIn=`${security.sessionMinutes}m`;
  const token=jwt.sign({sub:user.id,email:user.email,role:user.role},env.jwtSecret,{expiresIn,algorithm:'HS256'});
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[user.id,'SUPER_ADMIN_LOGIN',req.ip]);
  res.cookie('admin_session',token,{...cookieOptions,maxAge:security.sessionMinutes*60*1000}).json({user:{id:user.id,name:user.name,email:user.email,role:user.role},expiresIn});
});

router.get('/super-admin/session',requireSuperAdmin,async(req,res)=>{
  const {rows}=await pool.query("SELECT id,name,email,role FROM users WHERE id=$1 AND role='SUPER_ADMIN' AND active=true",[req.user.sub]);
  if(!rows[0]) return res.status(401).json({message:'Session is no longer valid'});
  res.json({user:rows[0]});
});

router.post('/super-admin/logout',requireSuperAdmin,async(req,res)=>{
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[req.user.sub,'SUPER_ADMIN_LOGOUT',req.ip]);
  res.clearCookie('admin_session',{...cookieOptions,maxAge:undefined}).status(204).end();
});
export default router;
