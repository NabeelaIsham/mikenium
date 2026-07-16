import {Router} from 'express';
import {pool} from '../config/db.js';
const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query('SELECT general,identity,seo,social,maintenance,others,updated_at FROM site_settings WHERE id=1');
  if(!rows[0])return res.status(404).json({message:'Site settings have not been initialized'});
  res.set('Cache-Control','no-store').json({settings:rows[0]});
});
export default router;
