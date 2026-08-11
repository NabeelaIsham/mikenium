import React,{useEffect} from 'react';

const SITE_NAME='Mikenium';
const DEFAULT_IMAGE='/assets/mikenium-logo-transparent.png';

function upsertMeta(selector,attributes){
  let element=document.head.querySelector(selector);
  if(!element){element=document.createElement('meta');document.head.appendChild(element)}
  Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,value));
}
function upsertLink(rel,href){
  let element=document.head.querySelector(`link[rel="${rel}"]`);
  if(!element){element=document.createElement('link');element.rel=rel;document.head.appendChild(element)}
  element.href=href;
}

export default function Seo({title,description,path=window.location.pathname,image=DEFAULT_IMAGE,type='website',robots='index, follow',schema,keywords=''}){
  const schemaJson=JSON.stringify(schema||null);
  useEffect(()=>{
    const canonical=new URL(path||'/',window.location.origin).href;
    const socialImage=new URL(image||DEFAULT_IMAGE,window.location.origin).href;
    document.title=title;
    upsertMeta('meta[name="description"]',{name:'description',content:description});
    upsertMeta('meta[name="robots"]',{name:'robots',content:robots});
    if(keywords)upsertMeta('meta[name="keywords"]',{name:'keywords',content:keywords});
    upsertMeta('meta[property="og:site_name"]',{property:'og:site_name',content:SITE_NAME});
    upsertMeta('meta[property="og:type"]',{property:'og:type',content:type});
    upsertMeta('meta[property="og:title"]',{property:'og:title',content:title});
    upsertMeta('meta[property="og:description"]',{property:'og:description',content:description});
    upsertMeta('meta[property="og:url"]',{property:'og:url',content:canonical});
    upsertMeta('meta[property="og:image"]',{property:'og:image',content:socialImage});
    upsertMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    upsertMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    upsertMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    upsertMeta('meta[name="twitter:image"]',{name:'twitter:image',content:socialImage});
    upsertLink('canonical',canonical);
    const graph=[
      {'@type':'Organization','@id':`${window.location.origin}/#organization`,name:SITE_NAME,url:`${window.location.origin}/`,logo:new URL(DEFAULT_IMAGE,window.location.origin).href},
      {'@type':'WebSite','@id':`${window.location.origin}/#website`,url:`${window.location.origin}/`,name:SITE_NAME,publisher:{'@id':`${window.location.origin}/#organization`}},
      {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:title,description,isPartOf:{'@id':`${window.location.origin}/#website`},about:{'@id':`${window.location.origin}/#organization`}},
      ...(schemaJson?[JSON.parse(schemaJson)].filter(Boolean):[])
    ];
    let script=document.head.querySelector('script[data-mikenium-schema]');
    if(!script){script=document.createElement('script');script.type='application/ld+json';script.dataset.mikeniumSchema='true';document.head.appendChild(script)}
    script.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});
  },[title,description,path,image,type,robots,keywords,schemaJson]);
  return null;
}
