import express,{Router} from 'express';
import {z} from 'zod';
import {randomUUID} from 'crypto';
import {mkdir,writeFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import path from 'path';
import {pool} from '../config/db.js';
import {requireSuperAdmin} from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid partner ID'}));
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const uploadsPath=fileURLToPath(new URL('../uploads/partners/',import.meta.url));
const optionalUrl=z.string().trim().max(2000).refine(value=>!value||value.startsWith('/')||URL.canParse(value),'Use a full URL or a local path starting with /').default('');
const schema=z.object({
  name:z.string().trim().min(2).max(160),
  descriptor:z.string().trim().max(120).default(''),
  websiteUrl:optionalUrl,
  logoUrl:optionalUrl,
  icon:z.enum(['building','layers','cloud','data','network','hexagon','badge','globe','briefcase','handshake']).default('building'),
  status:z.enum(['PUBLISHED','DRAFT','INACTIVE']).default('PUBLISHED'),
  order:z.coerce.number().int().min(0).max(999).default(0)
});
const updateSchema=schema.partial();
const serialize=row=>({id:row.id,name:row.name,descriptor:row.descriptor,websiteUrl:row.website_url||'',logoUrl:row.logo_url||'',icon:row.icon,status:row.status,order:row.display_order,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);

router.post('/logo-upload',express.raw({type:Object.keys(imageTypes),limit:'3mb'}),async(req,res)=>{
  const extension=imageTypes[req.get('content-type')];
  if(!extension||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(415).json({message:'Select a JPG, PNG, or WebP logo'});
  await mkdir(uploadsPath,{recursive:true});
  const filename=`${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadsPath,filename),req.body,{flag:'wx'});
  res.status(201).json({logoUrl:`${req.protocol}://${req.get('host')}/uploads/partners/${filename}`});
});
router.get('/',async(req,res)=>{
  const [records,stats]=await Promise.all([
    pool.query('SELECT * FROM partners ORDER BY display_order,created_at DESC'),
    pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='DRAFT')::int draft,count(*) FILTER(WHERE status='INACTIVE')::int inactive FROM partners`)
  ]);
  res.set('Cache-Control','no-store').json({partners:records.rows.map(serialize),stats:stats.rows[0]});
});
router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM partners WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Partner not found'});res.json({partner:serialize(rows[0])});});
router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid partner details'});
  const d=parsed.data;
  try{
    const {rows}=await pool.query(`INSERT INTO partners(name,descriptor,website_url,logo_url,icon,status,display_order) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[d.name,d.descriptor,d.websiteUrl||null,d.logoUrl||null,d.icon,d.status,d.order]);
    await audit(req.user.sub,'PARTNER_CREATED',req.ip,{targetPartnerId:rows[0].id,description:`Created partner ${rows[0].name}`});
    res.status(201).json({partner:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A partner with this name already exists'});throw error}
});
router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid partner details'});
  const columns={name:'name',descriptor:'descriptor',websiteUrl:'website_url',logoUrl:'logo_url',icon:'icon',status:'status',order:'display_order'};
  const fields=[],values=[];
  for(const[key,raw]of Object.entries(parsed.data)){values.push((key==='websiteUrl'||key==='logoUrl')&&!raw?null:raw);fields.push(`${columns[key]}=$${values.length}`)}
  if(!fields.length)return res.status(400).json({message:'No changes were provided'});
  values.push(req.params.id);
  try{
    const {rows}=await pool.query(`UPDATE partners SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);
    if(!rows[0])return res.status(404).json({message:'Partner not found'});
    await audit(req.user.sub,'PARTNER_UPDATED',req.ip,{targetPartnerId:req.params.id,description:`Updated partner ${rows[0].name}`});
    res.json({partner:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A partner with this name already exists'});throw error}
});
router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM partners WHERE id=$1 RETURNING id,name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Partner not found'});await audit(req.user.sub,'PARTNER_DELETED',req.ip,{targetPartnerId:req.params.id,description:`Deleted partner ${rows[0].name}`});res.status(204).end()});
export default router;
