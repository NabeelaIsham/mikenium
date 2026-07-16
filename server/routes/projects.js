import express,{ Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { mkdir,writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid project ID'}));

const statuses=['PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'];
const themes=['analytics','workspace','commerce','mobile','cloud','health','learning','travel','food'];
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const projectUploads=fileURLToPath(new URL('../uploads/projects/',import.meta.url));
const dateField=z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.literal(''),z.null()]);
const projectSchema=z.object({
  name:z.string().trim().min(2).max(180),
  slug:z.union([z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),z.literal('')]).optional(),
  description:z.string().trim().min(10).max(3000),
  clientId:z.union([z.string().uuid(),z.literal(''),z.null()]).optional(),
  category:z.string().trim().min(2).max(100),
  status:z.enum(statuses).default('PLANNED'),
  progress:z.coerce.number().int().min(0).max(100).default(0),
  startDate:dateField.optional(),
  deadline:dateField.optional(),
  result:z.string().trim().max(160).default(''),
  tags:z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  imageUrl:z.union([z.string().trim().url().max(2000),z.literal('')]).default(''),
  projectUrl:z.union([z.string().trim().url().max(2000),z.literal('')]).default(''),
  theme:z.enum(themes).default('analytics'),
  published:z.boolean().default(false),
  featured:z.boolean().default(false)
});
const updateSchema=projectSchema.partial();
const slugify=value=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,190);
const serialize=row=>({id:row.id,name:row.name,slug:row.slug,description:row.description,clientId:row.client_id,client:row.client_name||'',category:row.category,status:row.status,progress:Number(row.progress),startDate:row.start_date,deadline:row.deadline,result:row.public_result,tags:row.tags||[],imageUrl:row.image_url||'',projectUrl:row.project_url||'',theme:row.theme,published:row.is_published,featured:row.is_featured,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);
function databaseError(error,res){if(error.code==='23505')return res.status(409).json({message:'A project with this slug already exists'});if(error.code==='23503')return res.status(400).json({message:'Selected client does not exist'});throw error;}
const selectSql=`SELECT p.*,c.company_name AS client_name FROM projects p LEFT JOIN clients c ON c.id=p.client_id`;

router.post('/image-upload',express.raw({type:Object.keys(imageTypes),limit:'5mb'}),async(req,res)=>{
  const extension=imageTypes[req.get('content-type')];
  if(!extension||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(415).json({message:'Select a JPG, PNG, WebP, or GIF image'});
  await mkdir(projectUploads,{recursive:true});
  const filename=`${randomUUID()}.${extension}`;
  await writeFile(path.join(projectUploads,filename),req.body,{flag:'wx'});
  const imageUrl=`${req.protocol}://${req.get('host')}/uploads/projects/${filename}`;
  await audit(req.user.sub,'PROJECT_IMAGE_UPLOADED',req.ip,{filename,description:'Uploaded a project image'});
  res.status(201).json({imageUrl});
});

router.get('/',async(req,res)=>{
  const [records,stats]=await Promise.all([
    pool.query(`${selectSql} ORDER BY p.created_at DESC LIMIT 500`),
    pool.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE status='COMPLETED')::int AS completed,count(*) FILTER(WHERE status='IN_PROGRESS')::int AS in_progress,count(*) FILTER(WHERE status='ON_HOLD')::int AS on_hold,count(*) FILTER(WHERE status='CANCELLED')::int AS cancelled,count(*) FILTER(WHERE is_published)::int AS published FROM projects`)
  ]);
  res.set('Cache-Control','no-store').json({projects:records.rows.map(serialize),stats:stats.rows[0]});
});

router.get('/:id',async(req,res)=>{const {rows}=await pool.query(`${selectSql} WHERE p.id=$1`,[req.params.id]);if(!rows[0])return res.status(404).json({message:'Project not found'});res.set('Cache-Control','no-store').json({project:serialize(rows[0])});});

router.post('/',async(req,res)=>{
  const parsed=projectSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid project details'});
  const data=parsed.data;const slug=data.slug||slugify(data.name);if(!slug)return res.status(400).json({message:'Project name cannot produce a valid slug'});
  try{
    const {rows}=await pool.query(`INSERT INTO projects(name,slug,description,client_id,category,status,progress,start_date,deadline,public_result,tags,image_url,project_url,theme,is_published,is_featured) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,[data.name,slug,data.description,data.clientId||null,data.category,data.status,data.progress,data.startDate||null,data.deadline||null,data.result,data.tags,data.imageUrl||null,data.projectUrl||null,data.theme,data.published,data.featured]);
    await audit(req.user.sub,'PROJECT_CREATED',req.ip,{targetProjectId:rows[0].id,description:`Created project ${rows[0].name}`});
    const full=(await pool.query(`${selectSql} WHERE p.id=$1`,[rows[0].id])).rows[0];res.status(201).json({project:serialize(full)});
  }catch(error){return databaseError(error,res);}
});

router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid project details'});
  const columns={name:'name',slug:'slug',description:'description',clientId:'client_id',category:'category',status:'status',progress:'progress',startDate:'start_date',deadline:'deadline',result:'public_result',tags:'tags',imageUrl:'image_url',projectUrl:'project_url',theme:'theme',published:'is_published',featured:'is_featured'};
  const fields=[];const values=[];for(const [key,raw] of Object.entries(parsed.data)){if(key==='slug'&&!raw)continue;let value=raw;if(['clientId','startDate','deadline','imageUrl','projectUrl'].includes(key)&&!value)value=null;values.push(value);fields.push(`${columns[key]}=$${values.length}`);}
  if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);
  try{
    const result=await pool.query(`UPDATE projects SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING id,name`,values);if(!result.rows[0])return res.status(404).json({message:'Project not found'});
    await audit(req.user.sub,'PROJECT_UPDATED',req.ip,{targetProjectId:req.params.id,description:`Updated project ${result.rows[0].name}`});
    const full=(await pool.query(`${selectSql} WHERE p.id=$1`,[req.params.id])).rows[0];res.json({project:serialize(full)});
  }catch(error){return databaseError(error,res);}
});

router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM projects WHERE id=$1 RETURNING id,name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Project not found'});await audit(req.user.sub,'PROJECT_DELETED',req.ip,{targetProjectId:req.params.id,description:`Deleted project ${rows[0].name}`});res.status(204).end();});

export default router;
