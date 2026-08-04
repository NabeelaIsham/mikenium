import {pool} from '../config/db.js';
import {env} from '../config/env.js';
import {sendOperationalAlert} from './alerts.js';

export async function runHousekeeping(){
  const client=await pool.connect();let locked=false;
  try{
    locked=(await client.query('SELECT pg_try_advisory_lock($1) AS locked',[7483923])).rows[0].locked;
    if(!locked)return false;
    await client.query('BEGIN');
    await client.query(`DELETE FROM contact_messages WHERE status IN ('CLOSED','TRASH') AND created_at<now()-($1||' days')::interval`,[env.contactRetentionDays]);
    await client.query(`UPDATE contact_messages SET ip_address=NULL,user_agent='' WHERE created_at<now()-($1||' days')::interval AND (ip_address IS NOT NULL OR user_agent<>'')`,[env.securityMetadataRetentionDays]);
    await client.query(`UPDATE admin_audit_logs SET ip_address=NULL,metadata=metadata-'attemptedEmail' WHERE created_at<now()-($1||' days')::interval AND (ip_address IS NOT NULL OR metadata ? 'attemptedEmail')`,[env.securityMetadataRetentionDays]);
    await client.query(`DELETE FROM admin_audit_logs WHERE created_at<now()-($1||' days')::interval`,[env.auditRetentionDays]);
    await client.query(`DELETE FROM newsletter_subscribers WHERE (status='PENDING' AND confirmation_expires_at<now()-interval '7 days') OR (status='UNSUBSCRIBED' AND unsubscribed_at<now()-($1||' days')::interval)`,[env.newsletterRetentionDays]);
    await client.query('DELETE FROM admin_sessions WHERE expires_at<=now()');
    await client.query(`DELETE FROM request_rate_limits WHERE window_started_at<now()-interval '2 days'`);
    await client.query('COMMIT');
    return true;
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
  finally{if(locked)await client.query('SELECT pg_advisory_unlock($1)',[7483923]).catch(()=>{});client.release()}
}

export function startHousekeeping(){
  const execute=()=>runHousekeeping().catch(error=>{console.error('Data housekeeping failed:',error.message);void sendOperationalAlert('HOUSEKEEPING_FAILED',{message:error.message})});
  const initial=setTimeout(execute,60000);initial.unref();
  const interval=setInterval(execute,24*60*60*1000);interval.unref();
  return ()=>{clearTimeout(initial);clearInterval(interval)};
}
