import {Router} from 'express';
import {pool} from '../config/db.js';
const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query(`SELECT id,name,descriptor,website_url,logo_url,icon,display_order FROM partners WHERE status='PUBLISHED' ORDER BY display_order,created_at`);
  res.set('Cache-Control','no-store').json({partners:rows.map(row=>({id:row.id,name:row.name,descriptor:row.descriptor,websiteUrl:row.website_url||'',logoUrl:row.logo_url||'',icon:row.icon,order:row.display_order}))});
});
export default router;
