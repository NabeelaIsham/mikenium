import {Router} from 'express';
import {pool} from '../config/db.js';
import {publicUrlOr} from '../utils/safe-url.js';
const router=Router();
router.get('/',async(req,res)=>{
  const {rows}=await pool.query('SELECT general,identity,seo,social,maintenance,others,updated_at FROM site_settings WHERE id=1');
  if(!rows[0])return res.status(404).json({message:'Site settings have not been initialized'});
  const settings=rows[0];
  settings.identity={...settings.identity,logoUrl:publicUrlOr(settings.identity?.logoUrl),faviconUrl:publicUrlOr(settings.identity?.faviconUrl)};
  settings.seo={...settings.seo,ogImageUrl:publicUrlOr(settings.seo?.ogImageUrl)};
  settings.social=Object.fromEntries(Object.entries(settings.social||{}).map(([key,value])=>[key,publicUrlOr(value)]));
  settings.others={...settings.others,mapsUrl:publicUrlOr(settings.others?.mapsUrl)};
  res.set('Cache-Control','no-store').json({settings});
});
export default router;
