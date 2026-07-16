import { Router } from 'express';
import { pool } from '../config/db.js';

const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query(`SELECT id,name,slug,description,category,product_type,platform,features,tech_stack,image_url,product_url,is_featured,display_order FROM products WHERE status='PUBLISHED' ORDER BY is_featured DESC,display_order,created_at DESC`);
  res.set('Cache-Control','no-store').json({products:rows.map(row=>({id:row.id,name:row.name,slug:row.slug,description:row.description,category:row.category,type:row.product_type,platform:row.platform,features:row.features||[],techStack:row.tech_stack||[],imageUrl:row.image_url||'',productUrl:row.product_url||'',featured:row.is_featured,order:row.display_order}))});
});
export default router;
