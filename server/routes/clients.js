import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid client ID'}));

const clientSchema=z.object({
  name:z.string().trim().min(2).max(180),
  location:z.string().trim().min(2).max(180),
  contact:z.string().trim().min(2).max(140),
  title:z.string().trim().max(120).default(''),
  email:z.string().trim().email().max(255),
  phone:z.string().trim().max(50).default(''),
  industry:z.string().trim().min(2).max(100),
  status:z.enum(['ACTIVE','INACTIVE']).default('ACTIVE'),
  revenue:z.coerce.number().min(0).max(999999999999).default(0)
});
const updateSchema=clientSchema.partial();
const listSchema=z.object({q:z.string().trim().max(120).optional(),status:z.enum(['ACTIVE','INACTIVE']).optional(),industry:z.string().trim().max(100).optional()});
const serialize=row=>({id:row.id,name:row.company_name,location:row.location,contact:row.contact_name,title:row.contact_title||'',email:row.email,phone:row.phone||'',industry:row.industry,status:row.status,revenue:Number(row.revenue),createdAt:row.created_at,updatedAt:row.updated_at,projectCount:Number(row.project_count||0)});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);
function databaseError(error,res){if(error.code==='23505')return res.status(409).json({message:'A client with this email already exists'});throw error;}

router.get('/',async(req,res)=>{
  const parsed=listSchema.safeParse(req.query);if(!parsed.success)return res.status(400).json({message:'Invalid client filters'});
  const {q,status,industry}=parsed.data;const values=[];const where=[];
  if(q){values.push(`%${q}%`);where.push(`(c.company_name ILIKE $${values.length} OR c.contact_name ILIKE $${values.length} OR c.email ILIKE $${values.length} OR c.location ILIKE $${values.length})`);}
  if(status){values.push(status);where.push(`c.status=$${values.length}`);}
  if(industry){values.push(industry);where.push(`c.industry=$${values.length}`);}
  const condition=where.length?`WHERE ${where.join(' AND ')}`:'';
  const [records,stats]=await Promise.all([
    pool.query(`SELECT c.*,count(p.id)::int AS project_count FROM clients c LEFT JOIN projects p ON p.client_id=c.id ${condition} GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500`,values),
    pool.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='ACTIVE')::int AS active,count(*) FILTER(WHERE status='INACTIVE')::int AS inactive,coalesce(sum(revenue),0)::numeric AS revenue,(SELECT count(*)::int FROM projects WHERE client_id IS NOT NULL) AS projects FROM clients`)
  ]);
  res.set('Cache-Control','no-store').json({clients:records.rows.map(serialize),stats:{...stats.rows[0],revenue:Number(stats.rows[0].revenue)}});
});

router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT c.*,count(p.id)::int AS project_count FROM clients c LEFT JOIN projects p ON p.client_id=c.id WHERE c.id=$1 GROUP BY c.id',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Client not found'});res.set('Cache-Control','no-store').json({client:serialize(rows[0])});});

router.post('/',async(req,res)=>{const parsed=clientSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid client details'});const data=parsed.data;try{const {rows}=await pool.query(`INSERT INTO clients(company_name,location,contact_name,contact_title,email,phone,industry,status,revenue) VALUES($1,$2,$3,$4,lower($5),$6,$7,$8,$9) RETURNING *`,[data.name,data.location,data.contact,data.title,data.email,data.phone,data.industry,data.status,data.revenue]);await audit(req.user.sub,'CLIENT_CREATED',req.ip,{targetClientId:rows[0].id,description:`Created client ${rows[0].company_name}`});res.status(201).json({client:serialize(rows[0])});}catch(error){return databaseError(error,res);}});

router.patch('/:id',async(req,res)=>{const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid client details'});const columns={name:'company_name',location:'location',contact:'contact_name',title:'contact_title',email:'email',phone:'phone',industry:'industry',status:'status',revenue:'revenue'};const fields=[];const values=[];for(const [key,value] of Object.entries(parsed.data)){values.push(key==='email'?value.toLowerCase():value);fields.push(`${columns[key]}=$${values.length}`);}if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);try{const {rows}=await pool.query(`UPDATE clients SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({message:'Client not found'});await audit(req.user.sub,'CLIENT_UPDATED',req.ip,{targetClientId:req.params.id,description:`Updated client ${rows[0].company_name}`});res.json({client:serialize(rows[0])});}catch(error){return databaseError(error,res);}});

router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM clients WHERE id=$1 RETURNING id,company_name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Client not found'});await audit(req.user.sub,'CLIENT_DELETED',req.ip,{targetClientId:req.params.id,description:`Deleted client ${rows[0].company_name}`});res.status(204).end();});

export default router;
