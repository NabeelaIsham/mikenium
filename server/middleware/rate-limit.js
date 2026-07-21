import {createHash} from 'crypto';
import {pool} from '../config/db.js';

const identity=value=>createHash('sha256').update(String(value||'unknown')).digest('hex');

export async function consumeRateLimit({scope,identifier,limit,windowMs}){
  const key=identity(identifier);
  const seconds=Math.max(1,Math.ceil(windowMs/1000));
  const {rows}=await pool.query(`
    INSERT INTO request_rate_limits(scope,identifier_hash,window_started_at,request_count)
    VALUES($1,$2,now(),1)
    ON CONFLICT(scope,identifier_hash) DO UPDATE SET
      window_started_at=CASE WHEN request_rate_limits.window_started_at<=now()-($3||' seconds')::interval THEN now() ELSE request_rate_limits.window_started_at END,
      request_count=CASE WHEN request_rate_limits.window_started_at<=now()-($3||' seconds')::interval THEN 1 ELSE request_rate_limits.request_count+1 END
    RETURNING request_count,window_started_at
  `,[scope,key,seconds]);
  const resetAt=new Date(new Date(rows[0].window_started_at).getTime()+windowMs);
  if(rows[0].request_count===1)await pool.query(`DELETE FROM request_rate_limits WHERE window_started_at<now()-interval '2 days'`);
  return {allowed:rows[0].request_count<=limit,remaining:Math.max(0,limit-rows[0].request_count),resetAt};
}

export function rateLimit({scope,limit,windowMs,key=req=>req.ip}){
  return async(req,res,next)=>{
    try{
      const result=await consumeRateLimit({scope,identifier:key(req),limit,windowMs});
      res.set('RateLimit-Limit',String(limit));
      res.set('RateLimit-Remaining',String(result.remaining));
      res.set('RateLimit-Reset',String(Math.ceil(result.resetAt.getTime()/1000)));
      if(!result.allowed){
        res.set('Retry-After',String(Math.max(1,Math.ceil((result.resetAt-Date.now())/1000))));
        return res.status(429).json({message:'Too many requests. Please try again later.'});
      }
      next();
    }catch(nextError){next(nextError)}
  };
}
