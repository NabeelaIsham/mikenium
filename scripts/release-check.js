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

const requiredEnv=['DOMAIN','POSTGRES_PASSWORD','JWT_SECRET','BACKUP_ENCRYPTION_KEY','SUPER_ADMIN_EMAIL','SUPER_ADMIN_TOTP_SECRET','SMTP_HOST','SMTP_USER','SMTP_PASS','CONTACT_TO_EMAIL','BACKUP_OFFSITE_PATH','ALERT_WEBHOOK_URL'];
const requiredApprovals=['legalReviewCompleted','publicClaimsVerified','offsiteBackupTargetVerified','restoreDrillCompleted','monitoringAlertsTested','emailAuthenticationVerified','diskEncryptionVerified','penetrationTestCompleted'];

try{
  const env=parseEnv(await readFile('.env.production','utf8'));
  const approvals=JSON.parse(await readFile('.production-approvals.json','utf8'));
  const failures=[];
  for(const key of requiredEnv)if(!env[key]||/replace|example\.com|YOUR_/i.test(env[key]))failures.push(`${key} is missing or still uses an example value`);
  if(env.JWT_SECRET?.length<32)failures.push('JWT_SECRET must contain at least 32 characters');
  if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY||''))failures.push('BACKUP_ENCRYPTION_KEY must contain 64 hexadecimal characters');
  if(!env.ALERT_WEBHOOK_URL?.startsWith('https://'))failures.push('ALERT_WEBHOOK_URL must use HTTPS');
  for(const key of requiredApprovals)if(approvals[key]!==true)failures.push(`${key} has not been approved`);
  if(failures.length){console.error(`Production release blocked:\n- ${failures.join('\n- ')}`);process.exit(1)}
  console.log('Production release checks passed.');
}catch(error){
  console.error(`Production release blocked: ${error.message}`);
  console.error('Create .env.production and .production-approvals.json from their example files.');
  process.exit(1);
}
