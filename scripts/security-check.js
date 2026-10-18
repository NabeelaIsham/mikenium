import {createHash} from 'node:crypto';

const origin=new URL(process.argv[2]||'https://mikenium.com').origin;
const failures=[],assets=new Map();
const get=url=>fetch(url,{signal:AbortSignal.timeout(20000),redirect:'follow'});
try{
  for(const pathname of ['/','/services','/admin']){
    const response=await get(`${origin}${pathname}`);
    if(!response.ok)failures.push(`${pathname}: HTTP ${response.status}`);
    if(response.headers.get('x-content-type-options')!=='nosniff')failures.push(`${pathname}: MIME sniffing protection is missing`);
    if(!['DENY','SAMEORIGIN'].includes(response.headers.get('x-frame-options')?.toUpperCase()))failures.push(`${pathname}: frame protection is missing`);
    if(new URL(origin).protocol==='https:'&&!/max-age=\d+/.test(response.headers.get('strict-transport-security')||''))failures.push(`${pathname}: HTTPS transport policy is missing`);
    const policy=new Map((response.headers.get('content-security-policy')||'').split(';').filter(Boolean).map(value=>{const [key,...sources]=value.trim().split(/\s+/);return [key,sources]}));
    for(const key of ['default-src','script-src','style-src','font-src','img-src']){
      const sources=policy.get(key);
      if(!sources?.length||sources.some(value=>value.includes('*')||['https:','http:',"'unsafe-inline'","'unsafe-eval'"].includes(value)))failures.push(`${pathname}: ${key} is missing or overly broad`);
    }
    if(policy.get('style-src-attr')?.join(' ')!=="'none'")failures.push(`${pathname}: inline style attributes are not blocked`);
    const html=await response.text();
    if(/fonts\.(?:googleapis|gstatic)\.com/.test(html))failures.push(`${pathname}: external Google Fonts dependency remains`);
    let entries=0;
    for(const [tag] of html.matchAll(/<(?:script|link)\b[^>]*>/g)){
      if(tag.startsWith('<link')&&!/\brel="(?:stylesheet|modulepreload)"/.test(tag))continue;
      const reference=tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];if(!reference)continue;
      entries++;
      const integrity=tag.match(/\bintegrity="([^"]+)"/)?.[1];
      if(!integrity?.startsWith('sha384-')){failures.push(`${pathname}: missing SHA-384 integrity for ${reference}`);continue}
      const url=new URL(reference,response.url);
      if(url.origin!==origin){failures.push(`${pathname}: unexpected external entrypoint ${url.origin}`);continue}
      if(!assets.has(url.href)){
        const asset=await get(url);
        if(!asset.ok)throw new Error(`Asset ${url.pathname}: HTTP ${asset.status}`);
        assets.set(url.href,`sha384-${createHash('sha384').update(Buffer.from(await asset.arrayBuffer())).digest('base64')}`);
      }
      if(assets.get(url.href)!==integrity)failures.push(`${pathname}: integrity mismatch for ${reference}`);
    }
    if(!entries)failures.push(`${pathname}: no application entrypoints found`);
  }
  const head=await fetch(origin,{method:'HEAD',signal:AbortSignal.timeout(20000)});
  if(!head.ok)failures.push(`Homepage HEAD request: HTTP ${head.status}`);
  for(const route of ['users','blogs','settings','system-backups']){
    const response=await get(`${origin}/api/admin/${route}`);
    if(![401,403].includes(response.status))failures.push(`Anonymous /api/admin/${route}: expected 401/403, received ${response.status}`);
    if(!/no-store/.test(response.headers.get('cache-control')||''))failures.push(`/api/admin/${route}: no-store policy missing`);
    await response.arrayBuffer();
  }
}catch(error){failures.push(error.message)}
if(failures.length){console.error(`Website security checks failed:\n- ${failures.join('\n- ')}`);process.exitCode=1}
else console.log('Website CSP, security headers, local fonts, SHA-384 entrypoint integrity, HEAD response, and anonymous admin access checks passed. Host SSH/TCP settings require separate verification.');
