export function parseImageOrigins(value=''){
  return [...new Set(value.split(',').map(item=>item.trim()).filter(Boolean).map(item=>{
    try{
      const url=new URL(item);
      if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||/[\s*;'"\\]/.test(item+url.origin))throw new Error();
      return url.origin;
    }catch{throw new Error('CSP_IMAGE_ORIGINS must contain exact HTTPS origins without wildcards, paths, credentials, queries, or fragments')}
  }))];
}

export function securityPolicy({isProduction=false,cspImageOrigins=[]}={}){
  return {
    useDefaults:false,
    directives:{
      defaultSrc:["'self'"],
      baseUri:["'self'"],
      objectSrc:["'none'"],
      frameAncestors:["'self'"],
      formAction:["'self'"],
      scriptSrc:["'self'",'https://www.googletagmanager.com'],
      scriptSrcAttr:["'none'"],
      styleSrc:["'self'"],
      styleSrcAttr:["'none'"],
      fontSrc:["'self'"],
      imgSrc:["'self'",'data:',...cspImageOrigins],
      connectSrc:["'self'",'https://www.google-analytics.com','https://analytics.google.com','https://region1.google-analytics.com'],
      upgradeInsecureRequests:isProduction?[]:null
    }
  };
}
