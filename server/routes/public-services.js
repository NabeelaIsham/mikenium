import { Router } from 'express';
import { pool } from '../config/db.js';

const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query(`SELECT id,name,description,category,service_type,tagline,features,icon,display_order FROM services WHERE status='PUBLISHED' ORDER BY display_order,created_at`);
  res.set('Cache-Control','no-store').json({services:rows.map(row=>({id:row.id,name:row.name,description:row.description,category:row.category,type:row.service_type,tagline:row.tagline,features:row.features||[],icon:row.icon,order:row.display_order}))});
});
export default router;
