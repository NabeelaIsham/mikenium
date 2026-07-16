import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid user ID'}));

const roles=['ADMIN','EDITOR','CLIENT','AUTHOR','SUBSCRIBER'];
const createSchema=z.object({
  name:z.string().trim().min(2).max(120),
  username:z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  email:z.string().trim().email().max(255),
  password:z.string().min(12).max(200),
  role:z.enum(roles).default('CLIENT'),
  active:z.boolean().default(true),
  emailVerified:z.boolean().default(false)
});
const updateSchema=createSchema.omit({password:true}).partial().extend({password:z.string().min(12).max(200).optional()});
const listSchema=z.object({q:z.string().trim().max(120).optional(),role:z.enum([...roles,'SUPER_ADMIN']).optional(),active:z.enum(['true','false']).optional(),verified:z.enum(['true','false']).optional()});

function usernameFrom(name,email){return (name||email.split('@')[0]).toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,70)||`user${Date.now()}`;}
function serialize(row){return {id:row.id,name:row.name,username:row.username||row.email.split('@')[0],email:row.email,role:row.role,active:row.active,emailVerified:row.email_verified,createdAt:row.created_at,updatedAt:row.updated_at,lastLoginAt:row.last_login_at};}
async function audit(userId,action,ip,metadata={}){await pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);}
function databaseError(error,res){if(error.code==='23505')return res.status(409).json({message:error.constraint?.includes('username')?'Username already exists':'Email address already exists'});throw error;}

router.get('/',async(req,res)=>{
  const parsed=listSchema.safeParse(req.query);
  if(!parsed.success)return res.status(400).json({message:'Invalid user filters'});
  const {q,role,active,verified}=parsed.data;
  const values=[];const where=[];
  if(q){values.push(`%${q}%`);where.push(`(u.name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.username ILIKE $${values.length})`);}
  if(role){values.push(role);where.push(`u.role=$${values.length}`);}
  if(active){values.push(active==='true');where.push(`u.active=$${values.length}`);}
  if(verified){values.push(verified==='true');where.push(`u.email_verified=$${values.length}`);}
  const condition=where.length?`WHERE ${where.join(' AND ')}`:'';
  const [{rows},stats]=await Promise.all([
    pool.query(`SELECT u.* FROM users u ${condition} ORDER BY u.created_at DESC LIMIT 500`,values),
    pool.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE role IN('SUPER_ADMIN','ADMIN'))::int AS administrators,count(*) FILTER(WHERE role='CLIENT')::int AS clients,count(*) FILTER(WHERE role='SUBSCRIBER')::int AS subscribers,count(*) FILTER(WHERE NOT active)::int AS inactive FROM users`)
  ]);
  res.set('Cache-Control','no-store').json({users:rows.map(serialize),stats:stats.rows[0]});
});

router.get('/:id',async(req,res)=>{
  const {rows}=await pool.query('SELECT * FROM users WHERE id=$1',[req.params.id]);
  if(!rows[0])return res.status(404).json({message:'User not found'});
  res.set('Cache-Control','no-store').json({user:serialize(rows[0])});
});

router.post('/',async(req,res)=>{
  const parsed=createSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid user details'});
  const data=parsed.data;const username=data.username||usernameFrom(data.name,data.email);
  try{
    const passwordHash=await bcrypt.hash(data.password,12);
    const {rows}=await pool.query(`INSERT INTO users(name,username,email,password_hash,role,active,email_verified) VALUES($1,lower($2),lower($3),$4,$5,$6,$7) RETURNING *`,[data.name,username,data.email,passwordHash,data.role,data.active,data.emailVerified]);
    await audit(req.user.sub,'USER_CREATED',req.ip,{targetUserId:rows[0].id,description:`Created user ${rows[0].email}`});
    res.status(201).json({user:serialize(rows[0])});
  }catch(error){return databaseError(error,res);}
});

router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid user details'});
  const existing=await pool.query('SELECT * FROM users WHERE id=$1',[req.params.id]);
  if(!existing.rows[0])return res.status(404).json({message:'User not found'});
  if(existing.rows[0].role==='SUPER_ADMIN')return res.status(403).json({message:'The super-admin account cannot be changed here'});
  const data=parsed.data;const fields=[];const values=[];
  const add=(column,value)=>{values.push(value);fields.push(`${column}=$${values.length}`);};
  if(data.name!==undefined)add('name',data.name);
  if(data.username!==undefined)add('username',data.username.toLowerCase());
  if(data.email!==undefined)add('email',data.email.toLowerCase());
  if(data.role!==undefined)add('role',data.role);
  if(data.active!==undefined)add('active',data.active);
  if(data.emailVerified!==undefined)add('email_verified',data.emailVerified);
  if(data.password!==undefined)add('password_hash',await bcrypt.hash(data.password,12));
  if(!fields.length)return res.status(400).json({message:'No changes were provided'});
  values.push(req.params.id);
  try{
    const {rows}=await pool.query(`UPDATE users SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);
    await audit(req.user.sub,'USER_UPDATED',req.ip,{targetUserId:req.params.id,description:`Updated user ${rows[0].email}`});
    res.json({user:serialize(rows[0])});
  }catch(error){return databaseError(error,res);}
});

router.delete('/:id',async(req,res)=>{
  const {rows}=await pool.query('SELECT id,email,role FROM users WHERE id=$1',[req.params.id]);
  if(!rows[0])return res.status(404).json({message:'User not found'});
  if(rows[0].role==='SUPER_ADMIN'||rows[0].id===req.user.sub)return res.status(403).json({message:'The super-admin account cannot be deleted'});
  await pool.query('DELETE FROM users WHERE id=$1',[req.params.id]);
  await audit(req.user.sub,'USER_DELETED',req.ip,{targetUserId:req.params.id,description:`Deleted user ${rows[0].email}`});
  res.status(204).end();
});

export default router;
