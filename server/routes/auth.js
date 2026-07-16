import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';
const router=Router();

const loginSchema=z.object({email:z.string().trim().email().max(255),password:z.string().min(1).max(200)});
const cookieOptions={httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000,path:'/'};
const attempts=new Map();
function isRateLimited(ip){
  const now=Date.now(); const current=attempts.get(ip);
  if(!current||now-current.started>15*60*1000){attempts.set(ip,{started:now,count:1});return false;}
  current.count+=1; return current.count>10;
}

// Public website authentication can never issue a SUPER_ADMIN session.
router.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  const {rows}=await pool.query('SELECT * FROM users WHERE lower(email)=lower($1) AND active=true',[email||'']);
  const user=rows[0];
  if(!user || user.role==='SUPER_ADMIN' || !(await bcrypt.compare(password||'',user.password_hash))) return res.status(401).json({message:'Invalid credentials'});
  res.json({message:'Login successful',user:{id:user.id,email:user.email,role:user.role}});
});

// Browser login for the single database-provisioned super-admin account.
router.post('/super-admin/login',async(req,res)=>{
  if(isRateLimited(req.ip)) return res.status(429).json({message:'Too many login attempts. Try again in 15 minutes.'});
  const parsed=loginSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({message:'Enter a valid email and password'});
  const {email,password}=parsed.data;
  const allowedEmail=(process.env.SUPER_ADMIN_EMAIL||'info@mikenium.com').toLowerCase();
  if(email.toLowerCase()!==allowedEmail) return res.status(401).json({message:'Invalid email or password'});
  const {rows}=await pool.query("SELECT id,name,email,password_hash,role FROM users WHERE lower(email)=lower($1) AND role='SUPER_ADMIN' AND active=true",[email]);
  const user=rows[0];
  if(!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({message:'Invalid email or password'});
  await pool.query('UPDATE users SET last_login_at=now() WHERE id=$1',[user.id]);
  const token=jwt.sign({sub:user.id,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:'8h'});
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[user.id,'SUPER_ADMIN_LOGIN',req.ip]);
  attempts.delete(req.ip);
  res.cookie('admin_session',token,cookieOptions).json({user:{id:user.id,name:user.name,email:user.email,role:user.role},expiresIn:'8h'});
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
