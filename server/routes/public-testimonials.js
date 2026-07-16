import {Router} from 'express';
import {pool} from '../config/db.js';
const router=Router();
const serialize=row=>({id:row.id,clientName:row.client_name,clientTitle:row.client_title,company:row.company,text:row.testimonial,service:row.service,result:row.result,rating:Number(row.rating),avatarUrl:row.avatar_url||'',verified:row.is_verified,featured:row.is_featured,order:row.display_order});
router.get('/',async(req,res)=>{const {rows}=await pool.query(`SELECT * FROM testimonials WHERE status='PUBLISHED' ORDER BY is_featured DESC,display_order,COALESCE(published_at,created_at) DESC`);res.set('Cache-Control','no-store').json({testimonials:rows.map(serialize)});});
export default router;
