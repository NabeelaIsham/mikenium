import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
const router=Router();

// Public website authentication can never issue a SUPER_ADMIN session.
router.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  const {rows}=await pool.query('SELECT * FROM users WHERE lower(email)=lower($1) AND active=true',[email||'']);
  const user=rows[0];
  if(!user || user.role==='SUPER_ADMIN' || !(await bcrypt.compare(password||'',user.password_hash))) return res.status(401).json({message:'Invalid credentials'});
  res.json({message:'Login successful',user:{id:user.id,email:user.email,role:user.role}});
});

// Only the company's private tool/network should call this endpoint. The key is never shipped to the web client.
router.post('/company/super-admin-session',async(req,res)=>{
  if(!process.env.COMPANY_ACCESS_KEY || req.get('x-company-access-key')!==process.env.COMPANY_ACCESS_KEY) return res.status(404).end();
  const {email,password}=req.body;
  const {rows}=await pool.query("SELECT * FROM users WHERE lower(email)=lower($1) AND role='SUPER_ADMIN' AND active=true",[email||'']);
  const user=rows[0];
  if(!user || !(await bcrypt.compare(password||'',user.password_hash))) return res.status(401).json({message:'Invalid company credentials'});
  const token=jwt.sign({sub:user.id,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:'8h'});
  await pool.query('INSERT INTO admin_audit_logs (user_id,action,ip_address) VALUES ($1,$2,$3)',[user.id,'SUPER_ADMIN_LOGIN',req.ip]);
  res.json({token,expiresIn:'8h'});
});
export default router;
