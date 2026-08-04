import {env} from '../config/env.js';

const safeMethods=new Set(['GET','HEAD','OPTIONS']);
const loopbackHosts=new Set(['localhost','127.0.0.1','[::1]']);

function isLoopbackOrigin(value){
  try {
    const url=new URL(value);
    return ['http:','https:'].includes(url.protocol)&&loopbackHosts.has(url.hostname);
  }
  catch { return false; }
}

export function isTrustedBrowserRequest({method,origin,referer,fetchSite},allowedOrigins=env.clientOrigins,isProduction=env.isProduction){
  if(safeMethods.has(String(method||'GET').toUpperCase()))return true;
  const acceptedFetchSites=isProduction?['same-origin','none']:['same-origin','same-site','none'];
  if(fetchSite&&!acceptedFetchSites.includes(fetchSite))return false;
  const isAllowedOrigin=value=>allowedOrigins.includes(value)||(!isProduction&&isLoopbackOrigin(value));
  if(origin)return isAllowedOrigin(origin);
  if(referer){try{return isAllowedOrigin(new URL(referer).origin)}catch{return false}}
  return !isProduction;
}

export function requireTrustedBrowserOrigin(req,res,next){
  const trusted=isTrustedBrowserRequest({method:req.method,origin:req.get('origin'),referer:req.get('referer'),fetchSite:req.get('sec-fetch-site')});
  if(!trusted)return res.status(403).json({message:'Request origin could not be verified'});
  next();
}
