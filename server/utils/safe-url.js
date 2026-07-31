import {z} from 'zod';

export function isSafePublicUrl(value,{allowLocal=true}={}){
  if(typeof value!=='string')return false;
  const input=value.trim();
  if(!input)return true;
  if(allowLocal&&input.startsWith('/')&&!input.startsWith('//'))return true;
  try{
    const url=new URL(input);if(url.username||url.password)return false;
    if(url.protocol==='https:')return true;
    return url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  }catch{return false}
}

export function publicUrlOr(value,fallback=''){
  return isSafePublicUrl(value)?String(value||'').trim():fallback;
}

export function optionalPublicUrl(message='Use an HTTPS URL or a local path beginning with /'){
  return z.string().trim().max(2000).refine(value=>isSafePublicUrl(value),message).default('');
}

export function requiredPublicUrl(message='Use an HTTPS URL or a local path beginning with /'){
  return z.string().trim().min(1).max(2000).refine(value=>isSafePublicUrl(value),message);
}
