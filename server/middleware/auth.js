import jwt from 'jsonwebtoken';

function getCookie(req,name){
  const cookies=(req.headers.cookie||'').split(';');
  for(const cookie of cookies){
    const [key,...value]=cookie.trim().split('=');
    if(key===name) return decodeURIComponent(value.join('='));
  }
}

export function requireSuperAdmin(req,res,next){
  const token=getCookie(req,'admin_session') || req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(401).json({message:'Company admin session required'});
  try { const user=jwt.verify(token,process.env.JWT_SECRET); if(user.role!=='SUPER_ADMIN') throw new Error(); req.user=user; next(); }
  catch { return res.status(403).json({message:'Super admin access denied'}); }
}
