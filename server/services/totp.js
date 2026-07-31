import {createHmac,timingSafeEqual} from 'crypto';

export function decodeBase32(value){
  const normalized=String(value||'').toUpperCase().replace(/[\s=-]/g,'');
  if(!/^[A-Z2-7]+$/.test(normalized)||normalized.length<16)throw new Error('Invalid TOTP secret');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits='';for(const char of normalized)bits+=alphabet.indexOf(char).toString(2).padStart(5,'0');
  const bytes=[];for(let index=0;index+8<=bits.length;index+=8)bytes.push(parseInt(bits.slice(index,index+8),2));
  return Buffer.from(bytes);
}

export function totpAt(secret,counter,digits=6){
  const key=decodeBase32(secret);const input=Buffer.alloc(8);input.writeBigUInt64BE(BigInt(counter));
  const digest=createHmac('sha1',key).update(input).digest();const offset=digest[digest.length-1]&15;
  const value=(digest.readUInt32BE(offset)&0x7fffffff)%10**digits;
  return String(value).padStart(digits,'0');
}

export function findTotpCounter(secret,code,{now=Date.now(),window=1,stepSeconds=30}={}){
  const supplied=Buffer.from(String(code||''));if(!/^\d{6}$/.test(supplied.toString()))return null;
  const current=Math.floor(now/1000/stepSeconds);
  for(let delta=-window;delta<=window;delta++){
    const counter=current+delta;const expected=Buffer.from(totpAt(secret,counter));
    if(expected.length===supplied.length&&timingSafeEqual(expected,supplied))return counter;
  }
  return null;
}
