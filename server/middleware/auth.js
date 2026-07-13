import jwt from 'jsonwebtoken';
export function requireSuperAdmin(req,res,next){
  const token=req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ','');
  if(!token) return res.status(401).json({message:'Company admin session required'});
  try { const user=jwt.verify(token,process.env.JWT_SECRET); if(user.role!=='SUPER_ADMIN') throw new Error(); req.user=user; next(); }
  catch { return res.status(403).json({message:'Super admin access denied'}); }
}
