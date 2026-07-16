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
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid testimonial ID'}));
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const uploadsPath=fileURLToPath(new URL('../uploads/testimonials/',import.meta.url));
const url=z.string().trim().max(2000).refine(value=>!value||value.startsWith('/')||URL.canParse(value),'Use a full avatar URL or a local path starting with /').default('');
const schema=z.object({
  clientName:z.string().trim().min(2).max(140),
  clientTitle:z.string().trim().max(160).default(''),
  company:z.string().trim().min(2).max(180),
  text:z.string().trim().min(20).max(3000),
  service:z.string().trim().min(2).max(140),
  result:z.string().trim().max(160).default(''),
  rating:z.coerce.number().min(1).max(5),
  avatarUrl:url,
  verified:z.boolean().default(true),
  featured:z.boolean().default(false),
  status:z.enum(['PUBLISHED','PENDING','HIDDEN','ARCHIVED']).default('PENDING'),
  order:z.coerce.number().int().min(0).max(999).default(0)
});
const updateSchema=schema.partial();
const serialize=row=>({id:row.id,clientName:row.client_name,clientTitle:row.client_title,company:row.company,text:row.testimonial,service:row.service,result:row.result,rating:Number(row.rating),avatarUrl:row.avatar_url||'',verified:row.is_verified,featured:row.is_featured,status:row.status,order:row.display_order,publishedAt:row.published_at,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);
router.post('/image-upload',express.raw({type:Object.keys(imageTypes),limit:'5mb'}),async(req,res)=>{const extension=imageTypes[req.get('content-type')];if(!extension||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(415).json({message:'Select a JPG, PNG, or WebP image'});await mkdir(uploadsPath,{recursive:true});const filename=`${randomUUID()}.${extension}`;await writeFile(path.join(uploadsPath,filename),req.body,{flag:'wx'});res.status(201).json({imageUrl:`${req.protocol}://${req.get('host')}/uploads/testimonials/${filename}`});});
router.get('/',async(req,res)=>{const [records,stats]=await Promise.all([pool.query('SELECT * FROM testimonials ORDER BY display_order,created_at DESC'),pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='PENDING')::int pending,count(*) FILTER(WHERE status='HIDDEN')::int hidden,count(*) FILTER(WHERE status='ARCHIVED')::int archived FROM testimonials`)]);res.set('Cache-Control','no-store').json({testimonials:records.rows.map(serialize),stats:stats.rows[0]});});
router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM testimonials WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Testimonial not found'});res.json({testimonial:serialize(rows[0])});});
router.post('/',async(req,res)=>{const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid testimonial details'});const d=parsed.data;const publishedAt=d.status==='PUBLISHED'?new Date():null;const {rows}=await pool.query(`INSERT INTO testimonials(client_name,client_title,company,testimonial,service,result,rating,avatar_url,is_verified,is_featured,status,display_order,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,[d.clientName,d.clientTitle,d.company,d.text,d.service,d.result,d.rating,d.avatarUrl||null,d.verified,d.featured,d.status,d.order,publishedAt]);await audit(req.user.sub,'TESTIMONIAL_CREATED',req.ip,{targetTestimonialId:rows[0].id,description:`Created testimonial from ${rows[0].client_name}`});res.status(201).json({testimonial:serialize(rows[0])});});
router.patch('/:id',async(req,res)=>{const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid testimonial details'});const columns={clientName:'client_name',clientTitle:'client_title',company:'company',text:'testimonial',service:'service',result:'result',rating:'rating',avatarUrl:'avatar_url',verified:'is_verified',featured:'is_featured',status:'status',order:'display_order'};const fields=[],values=[];for(const[key,raw]of Object.entries(parsed.data)){let value=raw;if(key==='avatarUrl'&&!value)value=null;values.push(value);fields.push(`${columns[key]}=$${values.length}`)}if(parsed.data.status==='PUBLISHED')fields.push('published_at=COALESCE(published_at,now())');if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);const {rows}=await pool.query(`UPDATE testimonials SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({message:'Testimonial not found'});await audit(req.user.sub,'TESTIMONIAL_UPDATED',req.ip,{targetTestimonialId:req.params.id,description:`Updated testimonial from ${rows[0].client_name}`});res.json({testimonial:serialize(rows[0])});});
router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM testimonials WHERE id=$1 RETURNING id,client_name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Testimonial not found'});await audit(req.user.sub,'TESTIMONIAL_DELETED',req.ip,{targetTestimonialId:req.params.id,description:`Deleted testimonial from ${rows[0].client_name}`});res.status(204).end();});
export default router;
