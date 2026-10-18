// Invalid percent encoding must fail authentication, not throw into the 500
// handler (which also sends operational alerts).
export function readSessionCookie(header,name){
  if(typeof header!=='string')return undefined;
  let token;
  for(const part of header.split(';')){
    const separator=part.indexOf('=');
    if(separator<0||part.slice(0,separator).trim()!==name)continue;
    if(token!==undefined)return undefined;
    try{token=decodeURIComponent(part.slice(separator+1).trim())}catch{return undefined}
    if(!token||token.length>4096)return undefined;
  }
  return token;
}
