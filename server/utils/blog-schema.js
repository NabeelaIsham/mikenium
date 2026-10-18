import { z } from 'zod';
import {optionalPublicUrl,requiredPublicUrl} from './safe-url.js';
const slugify=value=>value.toLowerCase().trim().replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,210);
const url=optionalPublicUrl();
const text=z.string().trim().max(10000).default('');
const style=z.object({
  fontFamily:z.enum(['default','Inter','DM Sans','Manrope','Arial','Georgia','Courier New']).optional(),
  fontSize:z.number().int().min(12).max(80).optional(),
  fontWeight:z.enum(['400','500','600','700','800']).optional(),
  italic:z.boolean().optional(),underline:z.boolean().optional(),
  align:z.enum(['left','center','right']).optional(),
  lineHeight:z.number().min(1).max(2.5).optional(),
  color:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  background:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  padding:z.number().int().min(0).max(64).optional(),
  radius:z.number().int().min(0).max(40).optional()
}).optional();
const blockSchema=z.discriminatedUnion('type',[
  z.object({style,id:z.string().max(80),type:z.literal('faq'),title:z.string().max(200).default(''),items:z.array(z.object({question:z.string().min(1).max(300),answer:z.string().min(1).max(4000)})).min(1).max(30)}),
  z.object({style,id:z.string().max(80),type:z.literal('gallery'),title:z.string().max(200).default(''),columns:z.number().int().min(2).max(4).default(3),items:z.array(z.object({id:z.string().max(80),url:requiredPublicUrl(),alt:z.string().max(240).default(''),caption:z.string().max(300).default('')})).min(1).max(12)}),
  z.object({style,id:z.string().max(80),type:z.literal('heading'),level:z.number().int().min(2).max(6).default(2),eyebrow:z.string().max(100).default(''),title:z.string().min(2).max(240)}),
  z.object({style,id:z.string().max(80),type:z.literal('paragraph'),text:z.string().min(1).max(12000),lead:z.boolean().default(false)}),
  z.object({style,id:z.string().max(80),type:z.literal('quote'),text:z.string().min(1).max(2000),cite:z.string().max(240).default('')}),
  z.object({style,id:z.string().max(80),type:z.literal('list'),ordered:z.boolean().default(false),title:z.string().max(200).default(''),items:z.array(z.string().min(1).max(1000)).min(1).max(20)}),
  z.object({style,id:z.string().max(80),type:z.literal('image'),url:url,alt:z.string().max(240).default(''),caption:z.string().max(300).default('')}),
  z.object({style,id:z.string().max(80),type:z.literal('featureGrid'),title:z.string().max(200).default(''),items:z.array(z.object({title:z.string().min(1).max(140),text:z.string().max(1000)})).min(1).max(8)}),
  z.object({style,id:z.string().max(80),type:z.literal('callout'),eyebrow:z.string().max(100).default(''),title:z.string().min(1).max(200),text:z.string().max(1000).default(''),buttonLabel:z.string().max(80).default('Start a project'),buttonUrl:requiredPublicUrl().default('/contact')})
]);
export const schema=z.object({
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
  blocks:z.array(blockSchema).min(1).max(300,'Articles support up to 300 blocks. Remove or combine blocks before saving.'),
  seoTitle:z.string().trim().max(240).default(''),
  seoDescription:z.string().trim().max(320).default(''),
  featured:z.boolean().default(false),
  status:z.enum(['DRAFT','PUBLISHED','SCHEDULED','ARCHIVED']).default('DRAFT'),
  scheduledAt:z.union([z.string().datetime(),z.literal(''),z.null()]).optional()
}).superRefine((data,ctx)=>{if(data.status==='SCHEDULED'&&!data.scheduledAt)ctx.addIssue({code:z.ZodIssueCode.custom,path:['scheduledAt'],message:'Choose a scheduled publishing date'});});
const baseSchema=schema._def.schema;
export const updateSchema=baseSchema.partial();
