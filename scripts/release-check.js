import {readFile} from 'node:fs/promises';

function parseEnv(content){
  const result={};
  for(const raw of content.split(/\r?\n/)){
    const line=raw.trim();if(!line||line.startsWith('#'))continue;
    const index=line.indexOf('=');if(index<1)continue;
    const key=line.slice(0,index).trim();let value=line.slice(index+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    result[key]=value;
  }
  return result;
}

const requiredEnv=['DOMAIN','POSTGRES_PASSWORD','JWT_SECRET','BACKUP_ENCRYPTION_KEY','SUPER_ADMIN_EMAIL','SUPER_ADMIN_TOTP_SECRET','SMTP_HOST','SMTP_USER','SMTP_PASS','CONTACT_TO_EMAIL','BACKUP_OFFSITE_PATH'];
const requiredApprovals=['legalReviewCompleted','publicClaimsVerified','offsiteBackupTargetVerified','restoreDrillCompleted','monitoringAlertsTested','emailAuthenticationVerified','diskEncryptionVerified','penetrationTestCompleted'];

try{
  const env=parseEnv(await readFile('.env.production','utf8'));
  const approvals=JSON.parse(await readFile('.production-approvals.json','utf8'));
  const failures=[];
  for(const key of requiredEnv)if(!env[key]||/replace|example\.com|YOUR_/i.test(env[key]))failures.push(`${key} is missing or still uses an example value`);
  if(!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(env.DOMAIN||''))failures.push('DOMAIN must be a hostname such as mikenium.com, without a scheme or path');
  if(!/^[a-zA-Z0-9._~-]{32,}$/.test(env.POSTGRES_PASSWORD||''))failures.push('POSTGRES_PASSWORD must contain at least 32 URL-safe characters');
  if(env.JWT_SECRET?.length<64)failures.push('JWT_SECRET must contain at least 64 characters');
  if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY||''))failures.push('BACKUP_ENCRYPTION_KEY must contain 64 hexadecimal characters');
  if([env.POSTGRES_PASSWORD,env.JWT_SECRET,env.BACKUP_ENCRYPTION_KEY].filter(Boolean).some((value,index,array)=>array.indexOf(value)!==index))failures.push('Database, JWT, and backup encryption secrets must be different');
  if(!/^[A-Z2-7]{16,128}$/i.test(env.SUPER_ADMIN_TOTP_SECRET||''))failures.push('SUPER_ADMIN_TOTP_SECRET must be a valid base32 secret');
  if(env.ALERT_WEBHOOK_URL){try{if(new URL(env.ALERT_WEBHOOK_URL).protocol!=='https:')throw new Error()}catch{failures.push('ALERT_WEBHOOK_URL must be a valid HTTPS URL when configured')}}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.SUPER_ADMIN_EMAIL||''))failures.push('SUPER_ADMIN_EMAIL must be valid');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.CONTACT_TO_EMAIL||''))failures.push('CONTACT_TO_EMAIL must be valid');
  if(env.ALERT_TO_EMAIL&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ALERT_TO_EMAIL))failures.push('ALERT_TO_EMAIL must be valid when configured');
  if(!/^\//.test(env.BACKUP_OFFSITE_PATH||''))failures.push('BACKUP_OFFSITE_PATH must be an absolute Linux path');
  for(const key of requiredApprovals)if(approvals[key]!==true)failures.push(`${key} has not been approved`);
  if(failures.length){console.error(`Production release blocked:\n- ${failures.join('\n- ')}`);process.exit(1)}
  console.log('Production release checks passed.');
}catch(error){
  console.error(`Production release blocked: ${error.message}`);
  console.error('Create .env.production and .production-approvals.json from their example files.');
  process.exit(1);
}
