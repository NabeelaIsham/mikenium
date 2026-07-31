import express,{Router} from 'express';
import {z} from 'zod';
import {randomUUID} from 'crypto';
import {mkdir,writeFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import path from 'path';
import {pool} from '../config/db.js';
import {requireSuperAdmin} from '../middleware/auth.js';
import {optionalPublicUrl} from '../utils/safe-url.js';
import {validateImageUpload} from '../utils/image-upload.js';

const router=Router();
router.use(requireSuperAdmin);
const schemas={
  general:z.object({siteName:z.string().trim().min(2).max(100),tagline:z.string().trim().max(180),contactEmail:z.string().trim().email(),phonePrimary:z.string().trim().min(7).max(40),phoneSecondary:z.string().trim().max(40),address:z.string().trim().min(5).max(240),language:z.enum(['English','Sinhala','Tamil']),timezone:z.string().trim().min(2).max(80),itemsPerPage:z.coerce.number().int().min(5).max(100)}),
  identity:z.object({logoUrl:optionalPublicUrl(),faviconUrl:optionalPublicUrl(),logoAlt:z.string().trim().min(2).max(180),primaryColor:z.string().regex(/^#[0-9a-fA-F]{6}$/,'Use a six-digit hex colour')}),
  email:z.object({senderName:z.string().trim().min(2).max(120),replyTo:z.string().trim().email(),notificationEmail:z.string().trim().email(),notifyContact:z.boolean(),notifyNewsletter:z.boolean()}),
  seo:z.object({defaultTitle:z.string().trim().min(5).max(120),titleSuffix:z.string().trim().max(40),description:z.string().trim().min(20).max(320),keywords:z.string().trim().max(500),ogImageUrl:optionalPublicUrl(),allowIndexing:z.boolean()}),
  social:z.object({facebook:optionalPublicUrl(),instagram:optionalPublicUrl(),linkedin:optionalPublicUrl(),tiktok:optionalPublicUrl(),youtube:optionalPublicUrl()}),
  maintenance:z.object({enabled:z.boolean(),title:z.string().trim().min(3).max(120),message:z.string().trim().min(10).max(500)}),
  security:z.object({sessionMinutes:z.coerce.number().int().min(15).max(1440),maxLoginAttempts:z.coerce.number().int().min(3).max(20),auditLogging:z.boolean()}),
  others:z.object({copyright:z.string().trim().min(3).max(160),footerDescription:z.string().trim().min(10).max(300),businessHours:z.string().trim().max(160),mapsUrl:optionalPublicUrl(),showSystemStatus:z.boolean()})
};
const imageTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/x-icon':'ico','image/vnd.microsoft.icon':'ico'};
const uploadsPath=fileURLToPath(new URL('../uploads/settings/',import.meta.url));
const selectSettings=()=>pool.query('SELECT general,identity,email,seo,social,maintenance,security,others,updated_at FROM site_settings WHERE id=1');

router.get('/',async(req,res)=>{const {rows}=await selectSettings();res.set('Cache-Control','no-store').json({settings:rows[0]});});
router.patch('/:section',async(req,res)=>{
  const {section}=req.params;const schema=schemas[section];
  if(!schema)return res.status(404).json({message:'Unknown settings section'});
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid settings'});
  const {rows}=await pool.query(`UPDATE site_settings SET ${section}=$1::jsonb,updated_by=$2,updated_at=now() WHERE id=1 RETURNING ${section},updated_at`,[JSON.stringify(parsed.data),req.user.sub]);
  await pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[req.user.sub,'SITE_SETTINGS_UPDATED',req.ip,JSON.stringify({section,description:`Updated ${section} site settings`})]);
  res.json({section:rows[0][section],updatedAt:rows[0].updated_at});
});
router.post('/identity-upload',express.raw({type:Object.keys(imageTypes),limit:'3mb'}),async(req,res)=>{
  const extension=validateImageUpload(req.body,req.get('content-type'),imageTypes);if(!extension)return res.status(415).json({message:'Select a valid JPG, PNG, WebP, or ICO image'});
  await mkdir(uploadsPath,{recursive:true});const filename=`${randomUUID()}.${extension}`;await writeFile(path.join(uploadsPath,filename),req.body,{flag:'wx'});
  res.status(201).json({url:`${req.protocol}://${req.get('host')}/uploads/settings/${filename}`});
});
export default router;
