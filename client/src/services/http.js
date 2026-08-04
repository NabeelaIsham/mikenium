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
