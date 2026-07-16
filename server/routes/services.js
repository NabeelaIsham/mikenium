import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid service ID'}));

const statuses=['PUBLISHED','DRAFT','INACTIVE'];
const serviceSchema=z.object({
  name:z.string().trim().min(2).max(160),
  description:z.string().trim().min(10).max(1500),
  category:z.string().trim().min(2).max(100),
  type:z.enum(['Core Service','Support Service']).default('Core Service'),
  status:z.enum(statuses).default('PUBLISHED'),
  order:z.coerce.number().int().min(0).max(999).default(0),
  tagline:z.string().trim().max(120).default(''),
  features:z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  icon:z.enum(['code','mobile','design','cloud','commerce','support','security','marketing','database','automation']).default('code')
});
const updateSchema=serviceSchema.partial();
const serialize=row=>({id:row.id,name:row.name,description:row.description,category:row.category,type:row.service_type,status:row.status,order:row.display_order,tagline:row.tagline,features:row.features||[],icon:row.icon,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);

router.get('/',async(req,res)=>{
  const [records,stats]=await Promise.all([
    pool.query('SELECT * FROM services ORDER BY display_order,created_at DESC'),
    pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='DRAFT')::int draft,count(*) FILTER(WHERE status='INACTIVE')::int inactive FROM services`)
  ]);
  res.set('Cache-Control','no-store').json({services:records.rows.map(serialize),stats:stats.rows[0]});
});

router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM services WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Service not found'});res.json({service:serialize(rows[0])});});

router.post('/',async(req,res)=>{
  const parsed=serviceSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid service details'});
  const data=parsed.data;
  try{
    const {rows}=await pool.query(`INSERT INTO services(name,description,category,service_type,status,display_order,tagline,features,icon,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[data.name,data.description,data.category,data.type,data.status,data.order,data.tagline,data.features,data.icon,data.status==='PUBLISHED']);
    await audit(req.user.sub,'SERVICE_CREATED',req.ip,{targetServiceId:rows[0].id,description:`Created service ${rows[0].name}`});
    res.status(201).json({service:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A service with this name already exists'});throw error;}
});

router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid service details'});
  const columns={name:'name',description:'description',category:'category',type:'service_type',status:'status',order:'display_order',tagline:'tagline',features:'features',icon:'icon'};
  const fields=[];const values=[];
  for(const [key,value] of Object.entries(parsed.data)){values.push(value);fields.push(`${columns[key]}=$${values.length}`);if(key==='status'){values.push(value==='PUBLISHED');fields.push(`active=$${values.length}`);}}
  if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);
  try{
    const {rows}=await pool.query(`UPDATE services SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);
    if(!rows[0])return res.status(404).json({message:'Service not found'});
    await audit(req.user.sub,'SERVICE_UPDATED',req.ip,{targetServiceId:req.params.id,description:`Updated service ${rows[0].name}`});
    res.json({service:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A service with this name already exists'});throw error;}
});

router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM services WHERE id=$1 RETURNING id,name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Service not found'});await audit(req.user.sub,'SERVICE_DELETED',req.ip,{targetServiceId:req.params.id,description:`Deleted service ${rows[0].name}`});res.status(204).end();});

export default router;
