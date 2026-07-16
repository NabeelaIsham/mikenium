import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid pricing plan ID'}));

const nullablePrice=z.union([z.coerce.number().min(0).max(99999999),z.literal(''),z.null()]).optional();
const baseSchema=z.object({
  name:z.string().trim().min(2).max(120),
  eyebrow:z.string().trim().max(80).default(''),
  description:z.string().trim().min(10).max(1200),
  monthlyPrice:nullablePrice,
  annualPrice:nullablePrice,
  monthlyPriceLkr:nullablePrice,
  annualPriceLkr:nullablePrice,
  monthlyPriceAud:nullablePrice,
  annualPriceAud:nullablePrice,
  billingSuffix:z.string().trim().min(1).max(80).default('/ month'),
  features:z.array(z.string().trim().min(1).max(120)).max(15).default([]),
  ctaLabel:z.string().trim().min(1).max(80).default('Get started'),
  ctaUrl:z.string().trim().min(1).max(2000).default('/contact'),
  icon:z.enum(['rocket','zap','chart','shield','building','gem','star','briefcase']).default('rocket'),
  custom:z.boolean().default(false),
  popular:z.boolean().default(false),
  status:z.enum(['PUBLISHED','DRAFT','ARCHIVED']).default('PUBLISHED'),
  order:z.coerce.number().int().min(0).max(999).default(0)
});
const priceKeys=['monthlyPrice','annualPrice','monthlyPriceLkr','annualPriceLkr','monthlyPriceAud','annualPriceAud'];
const schema=baseSchema.superRefine((data,ctx)=>{if(!data.custom&&priceKeys.some(key=>data[key]===''||data[key]==null))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Monthly and annual prices are required for USD, LKR and AUD'});});
const updateSchema=baseSchema.partial();
const number=value=>value===null?null:Number(value);
const serialize=row=>({id:row.id,name:row.name,eyebrow:row.eyebrow,description:row.description,prices:{USD:{monthly:number(row.monthly_price),annual:number(row.annual_monthly_price)},LKR:{monthly:number(row.monthly_price_lkr),annual:number(row.annual_monthly_price_lkr)},AUD:{monthly:number(row.monthly_price_aud),annual:number(row.annual_monthly_price_aud)}},billingSuffix:row.billing_suffix,features:row.features||[],ctaLabel:row.cta_label,ctaUrl:row.cta_url,icon:row.icon,custom:row.is_custom,popular:row.is_popular,status:row.status,order:row.display_order,createdAt:row.created_at,updatedAt:row.updated_at});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);

router.get('/',async(req,res)=>{const [records,stats]=await Promise.all([pool.query('SELECT * FROM pricing_plans ORDER BY display_order,created_at'),pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='PUBLISHED')::int published,count(*) FILTER(WHERE status='DRAFT')::int draft,count(*) FILTER(WHERE status='ARCHIVED')::int archived,count(*) FILTER(WHERE is_popular)::int popular FROM pricing_plans`)]);res.set('Cache-Control','no-store').json({plans:records.rows.map(serialize),stats:stats.rows[0]});});
router.get('/:id',async(req,res)=>{const {rows}=await pool.query('SELECT * FROM pricing_plans WHERE id=$1',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Pricing plan not found'});res.json({plan:serialize(rows[0])});});
router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid pricing plan'});
  const d=parsed.data;
  try{const {rows}=await pool.query(`INSERT INTO pricing_plans(name,eyebrow,description,monthly_price,annual_monthly_price,monthly_price_lkr,annual_monthly_price_lkr,monthly_price_aud,annual_monthly_price_aud,billing_suffix,features,cta_label,cta_url,icon,is_custom,is_popular,status,display_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,[d.name,d.eyebrow,d.description,d.custom?null:d.monthlyPrice,d.custom?null:d.annualPrice,d.custom?null:d.monthlyPriceLkr,d.custom?null:d.annualPriceLkr,d.custom?null:d.monthlyPriceAud,d.custom?null:d.annualPriceAud,d.billingSuffix,d.features,d.ctaLabel,d.ctaUrl,d.icon,d.custom,d.popular,d.status,d.order]);await audit(req.user.sub,'PRICING_PLAN_CREATED',req.ip,{targetPricingPlanId:rows[0].id,description:`Created pricing plan ${rows[0].name}`});res.status(201).json({plan:serialize(rows[0])});}catch(error){if(error.code==='23505')return res.status(409).json({message:'A pricing plan with this name already exists'});throw error;}
});
router.patch('/:id',async(req,res)=>{
  const parsed=updateSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Invalid pricing plan'});
  const columns={name:'name',eyebrow:'eyebrow',description:'description',monthlyPrice:'monthly_price',annualPrice:'annual_monthly_price',monthlyPriceLkr:'monthly_price_lkr',annualPriceLkr:'annual_monthly_price_lkr',monthlyPriceAud:'monthly_price_aud',annualPriceAud:'annual_monthly_price_aud',billingSuffix:'billing_suffix',features:'features',ctaLabel:'cta_label',ctaUrl:'cta_url',icon:'icon',custom:'is_custom',popular:'is_popular',status:'status',order:'display_order'};
  const fields=[];const values=[];for(const [key,raw] of Object.entries(parsed.data)){let value=raw;if(priceKeys.includes(key)&&value==='')value=null;values.push(value);fields.push(`${columns[key]}=$${values.length}`);}if(!fields.length)return res.status(400).json({message:'No changes were provided'});values.push(req.params.id);
  try{const {rows}=await pool.query(`UPDATE pricing_plans SET ${fields.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING *`,values);if(!rows[0])return res.status(404).json({message:'Pricing plan not found'});await audit(req.user.sub,'PRICING_PLAN_UPDATED',req.ip,{targetPricingPlanId:req.params.id,description:`Updated pricing plan ${rows[0].name}`});res.json({plan:serialize(rows[0])});}catch(error){if(error.code==='23505')return res.status(409).json({message:'A pricing plan with this name already exists'});throw error;}
});
router.delete('/:id',async(req,res)=>{const {rows}=await pool.query('DELETE FROM pricing_plans WHERE id=$1 RETURNING id,name',[req.params.id]);if(!rows[0])return res.status(404).json({message:'Pricing plan not found'});await audit(req.user.sub,'PRICING_PLAN_DELETED',req.ip,{targetPricingPlanId:req.params.id,description:`Deleted pricing plan ${rows[0].name}`});res.status(204).end();});
export default router;
