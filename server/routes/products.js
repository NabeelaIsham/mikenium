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
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid product ID'}));

const statuses=['DRAFT','PUBLISHED','ARCHIVED'];
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const uploadsPath=fileURLToPath(new URL('../uploads/products/',import.meta.url));
const productSchema=z.object({
  name:z.string().trim().min(2).max(180),
  slug:z.union([z.string().trim().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),z.literal('')]).optional(),
  description:z.string().trim().min(10).max(2500),
  category:z.string().trim().min(2).max(100),
  type:z.string().trim().min(2).max(100),
  platform:z.string().trim().min(2).max(100),
  features:z.array(z.string().trim().min(1).max(100)).max(10).default([]),
  techStack:z.array(z.string().trim().min(1).max(50)).max(12).default([]),
  imageUrl:z.union([z.string().trim().url().max(2000),z.literal('')]).default(''),
  productUrl:z.union([z.string().trim().url().max(2000),z.literal('')]).default(''),
  status:z.enum(statuses).default('PUBLISHED'),
  featured:z.boolean().default(false),
  order:z.coerce.number().int().min(0).max(999).default(0)
});
const updateSchema=productSchema.partial();
const slugify=value=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,190);
const serialize=row=>({id:row.id,name:row.name,slug:row.slug,description:row.description,category:row.category,type:row.product_type,platform:row.platform,features:row.features||[],techStack:row.tech_stack||[],imageUrl:row.image_url||'',productUrl:row.product_url||'',status:row.status,featured:row.is_featured,order:row.display_order,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);

router.post('/image-upload',express.raw({type:Object.keys(imageTypes),limit:'5mb'}),async(req,res)=>{
  const extension=imageTypes[req.get('content-type')];
  if(!extension||!Buffer.isBuffer(req.body)||!req.body.length)return res.status(415).json({message:'Select a JPG, PNG, WebP, or GIF image'});
  await mkdir(uploadsPath,{recursive:true});
  const filename=`${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadsPath,filename),req.body,{flag:'wx'});
  const imageUrl=`${req.protocol}://${req.get('host')}/uploads/products/${filename}`;
  await audit(req.user.sub,'PRODUCT_IMAGE_UPLOADED',req.ip,{filename,description:'Uploaded a product image'});
  res.status(201).json({imageUrl});
});

router.get('/',async(req,res)=>{
  const [records,stats]=await Promise.all([
    pool.query('SELECT * FROM products ORDER BY display_order,created_at DESC'),
    pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='DRAFT')::int draft,count(*) FILTER(WHERE status='ARCHIVED')::int archived,count(*) FILTER(WHERE is_featured)::int featured FROM products`)
  ]);
  res.set('Cache-Control','no-store').json({products:records.rows.map(serialize),stats:stats.rows[0]});
});
router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM products WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Product not found'});res.json({product:serialize(rows[0])});});
router.post('/',async(req,res)=>{
  const parsed=productSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid product details'});
  const data=parsed.data;const slug=data.slug||slugify(data.name);if(!slug)return res.status(400).json({message:'Enter a valid product name'});
  try{
    const {rows}=await pool.query(`INSERT INTO products(name,slug,description,category,product_type,platform,features,tech_stack,image_url,product_url,status,is_featured,display_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,[data.name,slug,data.description,data.category,data.type,data.platform,data.features,data.techStack,data.imageUrl||null,data.productUrl||null,data.status,data.featured,data.order]);
    await audit(req.user.sub,'PRODUCT_CREATED',req.ip,{targetProductId:rows[0].id,description:`Created product ${rows[0].name}`});
    res.status(201).json({product:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A product with this name or slug already exists'});throw error;}
});
router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid product details'});
  const columns={name:'name',slug:'slug',description:'description',category:'category',type:'product_type',platform:'platform',features:'features',techStack:'tech_stack',imageUrl:'image_url',productUrl:'product_url',status:'status',featured:'is_featured',order:'display_order'};
  const fields=[];const values=[];for(const [key,raw] of Object.entries(parsed.data)){if(key==='slug'&&!raw)continue;let value=raw;if(['imageUrl','productUrl'].includes(key)&&!value)value=null;values.push(value);fields.push(`${columns[key]}=$${values.length}`);}
  if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);
  try{
    const {rows}=await pool.query(`UPDATE products SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({message:'Product not found'});
    await audit(req.user.sub,'PRODUCT_UPDATED',req.ip,{targetProductId:req.params.id,description:`Updated product ${rows[0].name}`});
    res.json({product:serialize(rows[0])});
  }catch(error){if(error.code==='23505')return res.status(409).json({message:'A product with this name or slug already exists'});throw error;}
});
router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM products WHERE id=$1 RETURNING id,name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Product not found'});await audit(req.user.sub,'PRODUCT_DELETED',req.ip,{targetProductId:req.params.id,description:`Deleted product ${rows[0].name}`});res.status(204).end();});

export default router;
