export async function fetchWithTimeout(url,options={},timeoutMs=15000){
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),timeoutMs);
  if(options.signal){
    if(options.signal.aborted)controller.abort();
    else options.signal.addEventListener('abort',()=>controller.abort(),{once:true});
  }
  try{return await fetch(url,{...options,signal:controller.signal})}
  catch(error){
    if(error.name==='AbortError')throw new Error('The server took too long to respond. Please try again.');
    throw error;
  }finally{window.clearTimeout(timeout)}
}

const API_ORIGIN=(import.meta.env.VITE_API_URL||(import.meta.env.DEV?'http://localhost:5000':'')).replace(/\/$/,'');

export function resolveAssetUrl(value){
  if(!value)return '';
  if(!API_ORIGIN||!String(value).startsWith('/uploads/'))return value;
  return `${API_ORIGIN}${value}`;
}
