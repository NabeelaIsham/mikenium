import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {randomUUID} from 'crypto';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';
import {consumeRateLimit} from '../middleware/rate-limit.js';
import {env} from '../config/env.js';
import {findTotpCounter} from '../services/totp.js';
import {requireTrustedBrowserOrigin} from '../middleware/browser-origin.js';
const router=Router();

const loginSchema=z.object({email:z.string().trim().email().max(255),password:z.string().min(1).max(200),code:z.string().trim().regex(/^\d{6}$/)});
const cookieOptions={httpOnly:true,sameSite:'strict',secure:env.isProduction,path:'/',priority:'high'};
const sessionCookie=env.isProduction?'__Host-admin_session':'admin_session';
const normalizeEmail=value=>String(value||'').trim().toLowerCase();
async function getSecuritySettings(){const {rows}=await pool.query('SELECT security FROM site_settings WHERE id=1');return {sessionMinutes:480,maxLoginAttempts:5,...rows[0]?.security}}
const logFailedLogin=(email,ip,reason)=>pool.query('INSERT INTO admin_audit_logs(action,ip_address,metadata) VALUES($1,$2,$3)',['SUPER_ADMIN_LOGIN_FAILED',ip,JSON.stringify({description:'Failed super admin login attempt',attemptedEmail:String(email||'').slice(0,255),reason})]);
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next()});
router.use('/super-admin',requireTrustedBrowserOrigin);

// Browser login for the single database-provisioned super-admin account.
router.post('/super-admin/login',async(req,res)=>{
  if(!env.superAdminTotpSecret)return res.status(503).json({message:'Super-admin MFA is not configured'});
  const security=await getSecuritySettings();
  const normalizedEmail=normalizeEmail(req.body?.email);
  const [ipRate,ipAccountRate,accountRate]=await Promise.all([
    consumeRateLimit({scope:'super-admin-login-ip',identifier:req.ip,limit:Math.max(20,security.maxLoginAttempts*4),windowMs:15*60*1000}),
    consumeRateLimit({scope:'super-admin-login-ip-account',identifier:`${req.ip}:${normalizedEmail||'invalid'}`,limit:security.maxLoginAttempts,windowMs:15*60*1000}),
    consumeRateLimit({scope:'super-admin-login-account',identifier:normalizedEmail||'invalid',limit:Math.max(20,security.maxLoginAttempts*5),windowMs:15*60*1000})
  ]);
  if(!ipRate.allowed||!ipAccountRate.allowed||!accountRate.allowed){const resetAt=new Date(Math.max(ipRate.resetAt,ipAccountRate.resetAt,accountRate.resetAt));res.set('Retry-After',String(Math.max(1,Math.ceil((resetAt-Date.now())/1000))));await logFailedLogin(normalizedEmail,req.ip,'Rate limited');return res.status(429).json({message:'Too many login attempts. Try again later.'});}
  const parsed=loginSchema.safeParse(req.body);
  if(!parsed.success){await logFailedLogin(normalizedEmail,req.ip,'Invalid request');return res.status(400).json({message:'Enter a valid email, password, and six-digit authentication code'});}
  const {email,password,code}=parsed.data;
  const allowedEmail=normalizeEmail(process.env.SUPER_ADMIN_EMAIL||'info@mikenium.com');
  if(email.toLowerCase()!==allowedEmail){await logFailedLogin(email,req.ip,'Account not allowed');return res.status(401).json({message:'Invalid email or password'});}
  const {rows}=await pool.query("SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=lower($1) AND role='SUPER_ADMIN' AND active=true",[email]);
  const user=rows[0];
  if(!user || !(await bcrypt.compare(password,user.password_hash))){await logFailedLogin(email,req.ip,'Invalid credentials');return res.status(401).json({message:'Invalid email or password'});}
  const totpCounter=findTotpCounter(env.superAdminTotpSecret,code);
  if(totpCounter===null){await logFailedLogin(email,req.ip,'Invalid MFA code');return res.status(401).json({message:'Invalid email, password, or authentication code'});}
  const updated=await pool.query('UPDATE users SET last_login_at=now(),last_totp_counter=$2 WHERE id=$1 AND last_totp_counter<$2 RETURNING id',[user.id,totpCounter]);
  if(!updated.rows[0]){await logFailedLogin(email,req.ip,'Replayed MFA code');return res.status(401).json({message:'Authentication code has already been used. Wait for a new code.'});}
  const expiresIn=`${security.sessionMinutes}m`;
  const sessionId=randomUUID();const expiresAt=new Date(Date.now()+security.sessionMinutes*60*1000);
  await pool.query('DELETE FROM admin_sessions WHERE expires_at<=now()');
  await pool.query('INSERT INTO admin_sessions(id,user_id,expires_at,ip_address,user_agent) VALUES($1,$2,$3,$4,$5)',[sessionId,user.id,expiresAt,req.ip,(req.get('user-agent')||'').slice(0,1000)]);
  const token=jwt.sign({sub:user.id,email:user.email,role:user.role},env.jwtSecret,{expiresIn,algorithm:'HS256',jwtid:sessionId,issuer:'mikenium',audience:'mikenium-admin'});
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[user.id,'SUPER_ADMIN_LOGIN',req.ip]);
  res.cookie(sessionCookie,token,{...cookieOptions,maxAge:security.sessionMinutes*60*1000}).json({user:{id:user.id,name:user.name,email:user.email,role:user.role},expiresIn});
});

router.get('/super-admin/session',requireSuperAdmin,async(req,res)=>{
  const {rows}=await pool.query("SELECT id,name,email,role FROM users WHERE id=$1 AND role='SUPER_ADMIN' AND active=true",[req.user.sub]);
  if(!rows[0]) return res.status(401).json({message:'Session is no longer valid'});
  res.json({user:rows[0]});
});

router.post('/super-admin/logout',requireSuperAdmin,async(req,res)=>{
  await pool.query('DELETE FROM admin_sessions WHERE id=$1',[req.user.jti]);
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[req.user.sub,'SUPER_ADMIN_LOGOUT',req.ip]);
  res.clearCookie(sessionCookie,cookieOptions).clearCookie('admin_session',{...cookieOptions,secure:false}).status(204).end();
});
export default router;
