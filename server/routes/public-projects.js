import { Router } from 'express';
import { pool } from '../config/db.js';

const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query(`SELECT p.id,p.name,p.slug,p.description,p.category,p.public_result,p.tags,p.image_url,p.project_url,p.theme,p.is_featured,p.created_at,c.company_name AS client FROM projects p LEFT JOIN clients c ON c.id=p.client_id WHERE p.is_published=true ORDER BY p.is_featured DESC,p.created_at DESC`);
  res.set('Cache-Control','no-store').json({projects:rows.map(row=>({id:row.id,name:row.name,slug:row.slug,description:row.description,category:row.category,result:row.public_result,tags:row.tags||[],imageUrl:row.image_url||'',projectUrl:row.project_url||'',theme:row.theme,featured:row.is_featured,client:row.client||'',createdAt:row.created_at}))});
});
export default router;
