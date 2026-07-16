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
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid blog ID'}));
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const uploadsPath=fileURLToPath(new URL('../uploads/blogs/',import.meta.url));
const slugify=value=>value.toLowerCase().trim().replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,210);
const url=z.string().trim().max(2000).refine(value=>!value||value.startsWith('/')||URL.canParse(value),'Use a full image URL or a local path starting with /').default('');
const text=z.string().trim().max(10000).default('');
const blockSchema=z.discriminatedUnion('type',[
  z.object({id:z.string().max(80),type:z.literal('heading'),eyebrow:z.string().max(100).default(''),title:z.string().min(2).max(240)}),
  z.object({id:z.string().max(80),type:z.literal('paragraph'),text:z.string().min(1).max(12000),lead:z.boolean().default(false)}),
  z.object({id:z.string().max(80),type:z.literal('quote'),text:z.string().min(1).max(2000),cite:z.string().max(240).default('')}),
  z.object({id:z.string().max(80),type:z.literal('list'),title:z.string().max(200).default(''),items:z.array(z.string().min(1).max(1000)).min(1).max(20)}),
  z.object({id:z.string().max(80),type:z.literal('image'),url:url,alt:z.string().max(240).default(''),caption:z.string().max(300).default('')}),
  z.object({id:z.string().max(80),type:z.literal('featureGrid'),title:z.string().max(200).default(''),items:z.array(z.object({title:z.string().min(1).max(140),text:z.string().max(1000)})).min(1).max(8)}),
  z.object({id:z.string().max(80),type:z.literal('callout'),eyebrow:z.string().max(100).default(''),title:z.string().min(1).max(200),text:z.string().max(1000).default(''),buttonLabel:z.string().max(80).default('Start a project'),buttonUrl:z.string().max(2000).default('/contact')})
]);
const schema=z.object({
  title:z.string().trim().min(5).max(240),
  slug:z.preprocess(value=>typeof value==='string'&&value.trim()?slugify(value):'',z.string().max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).or(z.literal(''))).optional(),
  excerpt:z.string().trim().min(20).max(1000),
  category:z.string().trim().min(2).max(100),
  authorName:z.string().trim().min(2).max(140),
  authorTitle:z.string().trim().max(160).default(''),
  authorBio:text,
  authorAvatarUrl:url,
  coverImageUrl:url,
  coverCaption:z.string().trim().max(240).default(''),
  readingMinutes:z.coerce.number().int().min(1).max(120).default(5),
  tags:z.array(z.string().trim().min(1).max(50)).max(15).default([]),
  blocks:z.array(blockSchema).min(1).max(60),
  seoTitle:z.string().trim().max(240).default(''),
  seoDescription:z.string().trim().max(320).default(''),
  featured:z.boolean().default(false),
  status:z.enum(['DRAFT','PUBLISHED','SCHEDULED','ARCHIVED']).default('DRAFT'),
  scheduledAt:z.union([z.string().datetime(),z.literal(''),z.null()]).optional()
}).superRefine((data,ctx)=>{if(data.status==='SCHEDULED'&&!data.scheduledAt)ctx.addIssue({code:z.ZodIssueCode.custom,path:['scheduledAt'],message:'Choose a scheduled publishing date'});});
const baseSchema=schema._def.schema;
const updateSchema=baseSchema.partial();
const serialize=row=>({id:row.id,title:row.title,slug:row.slug,excerpt:row.excerpt,category:row.category,authorName:row.author_name,authorTitle:row.author_title,authorBio:row.author_bio,authorAvatarUrl:row.author_avatar_url||'',coverImageUrl:row.cover_image_url||'',coverCaption:row.cover_caption,readingMinutes:Number(row.reading_minutes),tags:row.tags||[],blocks:row.content_blocks||[],seoTitle:row.seo_title,seoDescription:row.seo_description,featured:row.is_featured,status:row.status,scheduledAt:row.scheduled_at,publishedAt:row.published_at,views:Number(row.views),createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);
function validationError(error){
  const issue=error.issues[0];
  const field=issue?.path?.map(part=>typeof part==='number'?`item ${part+1}`:part).join(' → ');
  return {message:`${field?`${field}: `:''}${issue?.message||'Invalid blog details'}`,field,issues:error.issues};
}

router.post('/image-upload',express.raw({type:Object.keys(imageTypes),limit:'5mb'}),async(req,res)=>{
  const extension=imageTypes[req.get('content-type')];
  if(!extension||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(415).json({message:'Select a JPG, PNG, WebP, or GIF image'});
  await mkdir(uploadsPath,{recursive:true});const filename=`${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadsPath,filename),req.body,{flag:'wx'});
  res.status(201).json({imageUrl:`${req.protocol}://${req.get('host')}/uploads/blogs/${filename}`});
});
router.get('/',async(req,res)=>{const [records,stats]=await Promise.all([pool.query('SELECT * FROM blog_posts ORDER BY created_at DESC'),pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='DRAFT')::int draft,count(*) FILTER(WHERE status='SCHEDULED')::int scheduled,count(*) FILTER(WHERE status='ARCHIVED')::int archived FROM blog_posts`)]);res.set('Cache-Control','no-store').json({blogs:records.rows.map(serialize),stats:stats.rows[0]});});
router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM blog_posts WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Blog post not found'});res.json({blog:serialize(rows[0])});});
router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json(validationError(parsed.error));
  const d=parsed.data,slug=d.slug||slugify(d.title),publishedAt=d.status==='PUBLISHED'?new Date():null;
  try{const {rows}=await pool.query(`INSERT INTO blog_posts(title,slug,excerpt,category,author_name,author_title,author_bio,author_avatar_url,cover_image_url,cover_caption,reading_minutes,tags,content_blocks,seo_title,seo_description,is_featured,status,published_at,scheduled_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,[d.title,slug,d.excerpt,d.category,d.authorName,d.authorTitle,d.authorBio,d.authorAvatarUrl||null,d.coverImageUrl||null,d.coverCaption,d.readingMinutes,d.tags,JSON.stringify(d.blocks),d.seoTitle,d.seoDescription,d.featured,d.status,publishedAt,d.scheduledAt||null]);await audit(req.user.sub,'BLOG_CREATED',req.ip,{targetBlogId:rows[0].id,description:`Created blog ${rows[0].title}`});res.status(201).json({blog:serialize(rows[0])});}catch(error){if(error.code==='23505')return res.status(409).json({message:'A blog with this slug already exists'});throw error;}
});
router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(validationError(parsed.error));
  const columns={title:'title',slug:'slug',excerpt:'excerpt',category:'category',authorName:'author_name',authorTitle:'author_title',authorBio:'author_bio',authorAvatarUrl:'author_avatar_url',coverImageUrl:'cover_image_url',coverCaption:'cover_caption',readingMinutes:'reading_minutes',tags:'tags',blocks:'content_blocks',seoTitle:'seo_title',seoDescription:'seo_description',featured:'is_featured',status:'status',scheduledAt:'scheduled_at'};
  const fields=[],values=[];for(const [key,raw] of Object.entries(parsed.data)){if(key==='slug'&&!raw)continue;let value=key==='blocks'?JSON.stringify(raw):raw;if(['authorAvatarUrl','coverImageUrl','scheduledAt'].includes(key)&&!value)value=null;values.push(value);fields.push(`${columns[key]}=$${values.length}`);}
  if(parsed.data.status==='PUBLISHED'){fields.push('published_at=COALESCE(published_at,now())');}if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);
  try{const {rows}=await pool.query(`UPDATE blog_posts SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({message:'Blog post not found'});await audit(req.user.sub,'BLOG_UPDATED',req.ip,{targetBlogId:req.params.id,description:`Updated blog ${rows[0].title}`});res.json({blog:serialize(rows[0])});}catch(error){if(error.code==='23505')return res.status(409).json({message:'A blog with this slug already exists'});throw error;}
});
router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM blog_posts WHERE id=$1 RETURNING id,title',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Blog post not found'});await audit(req.user.sub,'BLOG_DELETED',req.ip,{targetBlogId:req.params.id,description:`Deleted blog ${rows[0].title}`});res.status(204).end();});
export default router;
