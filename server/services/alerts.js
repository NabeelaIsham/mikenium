import {env} from '../config/env.js';
import {sendOperationalAlertEmail} from './mailer.js';

export async function sendOperationalAlert(event,details={}){
  const payload={service:'mikenium-api',event,timestamp:new Date().toISOString(),details};
  if(!env.alertWebhookUrl){
    try{await sendOperationalAlertEmail(payload);return true}
    catch(error){console.error(JSON.stringify({level:'error',event:'ALERT_DELIVERY_FAILED',channel:'email',message:error.message}));return false}
  }
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);timeout.unref();
  try{
    const response=await fetch(env.alertWebhookUrl,{
      method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!response.ok)throw new Error(`Alert webhook returned HTTP ${response.status}`);
    return true;
  }catch(error){
    console.error(JSON.stringify({level:'error',event:'ALERT_WEBHOOK_DELIVERY_FAILED',message:error.message}));
    try{await sendOperationalAlertEmail(payload);return true}
    catch(emailError){console.error(JSON.stringify({level:'error',event:'ALERT_DELIVERY_FAILED',channel:'email',message:emailError.message}));return false}
  }
  finally{clearTimeout(timeout)}
}
