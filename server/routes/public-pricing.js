import { Router } from 'express';
import { pool } from '../config/db.js';
const router=Router();
router.get('/',async(req,res)=>{const {rows}=await pool.query(`SELECT * FROM pricing_plans WHERE status='PUBLISHED' ORDER BY display_order,created_at`);const number=value=>value===null?null:Number(value);res.set('Cache-Control','no-store').json({plans:rows.map(row=>({id:row.id,name:row.name,eyebrow:row.eyebrow,description:row.description,prices:{USD:{monthly:number(row.monthly_price),annual:number(row.annual_monthly_price)},LKR:{monthly:number(row.monthly_price_lkr),annual:number(row.annual_monthly_price_lkr)},AUD:{monthly:number(row.monthly_price_aud),annual:number(row.annual_monthly_price_aud)}},billingSuffix:row.billing_suffix,features:row.features||[],ctaLabel:row.cta_label,ctaUrl:row.cta_url,icon:row.icon,custom:row.is_custom,popular:row.is_popular,order:row.display_order}))});});
export default router;
