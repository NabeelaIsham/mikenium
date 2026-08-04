import {env} from '../config/env.js';

export async function sendOperationalAlert(event,details={}){
  if(!env.alertWebhookUrl)return false;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);timeout.unref();
  try{
    const response=await fetch(env.alertWebhookUrl,{
      method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({service:'mikenium-api',event,timestamp:new Date().toISOString(),details})
    });
    if(!response.ok)throw new Error(`Alert webhook returned HTTP ${response.status}`);
    return true;
  }catch(error){console.error(JSON.stringify({level:'error',event:'ALERT_DELIVERY_FAILED',message:error.message}));return false}
  finally{clearTimeout(timeout)}
}
