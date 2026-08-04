import jwt from 'jsonwebtoken';
import {env} from '../config/env.js';
import {pool} from '../config/db.js';

function getCookie(req,name){
  const cookies=(req.headers.cookie||'').split(';');
  for(const cookie of cookies){
    const [key,...value]=cookie.trim().split('=');
    if(key===name) return decodeURIComponent(value.join('='));
  }
}

export async function requireSuperAdmin(req,res,next){
  const cookieName=env.isProduction?'__Host-admin_session':'admin_session';
  const token=getCookie(req,cookieName);
  if(!token) return res.status(401).json({message:'Company admin session required'});
  try {
    const user=jwt.verify(token,env.jwtSecret,{algorithms:['HS256'],issuer:'mikenium',audience:'mikenium-admin'});
    if(user.role!=='SUPER_ADMIN'||!user.jti)throw new Error();
    const {rows}=await pool.query(`
      UPDATE admin_sessions s SET last_seen_at=now()
      FROM users u
      WHERE s.id=$1 AND s.user_id=u.id AND s.user_id=$2 AND s.expires_at>now()
        AND u.active=true AND u.role='SUPER_ADMIN' AND s.user_agent=$3
      RETURNING s.id
    `,[user.jti,user.sub,(req.get('user-agent')||'').slice(0,1000)]);
    if(!rows[0])throw new Error();
    req.user=user;next();
  }
  catch {
    res.clearCookie(cookieName,{httpOnly:true,sameSite:'strict',secure:env.isProduction,path:'/'});
    return res.status(403).json({message:'Super admin access denied'});
  }
}
