import 'dotenv/config';

const productionRequired=['DATABASE_URL','JWT_SECRET','BACKUP_ENCRYPTION_KEY','SUPER_ADMIN_EMAIL','SUPER_ADMIN_TOTP_SECRET','CLIENT_URL','SMTP_HOST','SMTP_USER','SMTP_PASS','CONTACT_TO_EMAIL','BACKUP_OFFSITE_DIR','ALERT_WEBHOOK_URL'];

export function validateEnvironment(source=process.env){
  const isProduction=source.NODE_ENV==='production';
  const missing=(isProduction?productionRequired:['DATABASE_URL','JWT_SECRET']).filter(key=>!source[key]?.trim());
  if(missing.length)throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if((source.JWT_SECRET||'').length<32)throw new Error('JWT_SECRET must contain at least 32 characters');
  if(isProduction&&(source.JWT_SECRET||'').length<64)throw new Error('JWT_SECRET must contain at least 64 characters in production');
  if(isProduction&&source.JWT_SECRET?.toLowerCase().includes('replace'))throw new Error('JWT_SECRET must not use the example value');
  if(isProduction&&source.CLIENT_URL&&!source.CLIENT_URL.split(',').every(value=>value.trim().startsWith('https://')))throw new Error('CLIENT_URL must use HTTPS in production');
  if(source.BACKUP_ENCRYPTION_KEY){
    const value=source.BACKUP_ENCRYPTION_KEY.trim();
    const validHex=/^[a-f0-9]{64}$/i.test(value);
    let validBase64=false;
    try{validBase64=Buffer.from(value,'base64').length===32}catch{}
    if(!validHex&&!validBase64)throw new Error('BACKUP_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or base64');
  }
  const totpSecret=(source.SUPER_ADMIN_TOTP_SECRET||'').toUpperCase().replace(/[\s=-]/g,'');
  if(totpSecret&&!/^[A-Z2-7]{16,128}$/.test(totpSecret))throw new Error('SUPER_ADMIN_TOTP_SECRET must be a base32 secret containing at least 16 characters');
  if(isProduction&&totpSecret.toLowerCase().includes('replace'))throw new Error('SUPER_ADMIN_TOTP_SECRET must not use the example value');
  const positiveInteger=(key,fallback)=>{
    const value=Number(source[key]||fallback);
    if(!Number.isSafeInteger(value)||value<=0)throw new Error(`${key} must be a positive integer`);
    return value;
  };
  if(isProduction&&source.ALERT_WEBHOOK_URL&&!source.ALERT_WEBHOOK_URL.startsWith('https://'))throw new Error('ALERT_WEBHOOK_URL must use HTTPS in production');
  return {
    nodeEnv:source.NODE_ENV||'development',
    isProduction,
    port:Number(source.PORT||5000),
    databaseUrl:source.DATABASE_URL,
    jwtSecret:source.JWT_SECRET,
    clientOrigins:(source.CLIENT_URL||(isProduction?'':'http://localhost:5173')).split(',').map(value=>value.trim()).filter(Boolean),
    staticDir:source.STATIC_DIR||'',
    backupEncryptionKey:source.BACKUP_ENCRYPTION_KEY||'',
    superAdminTotpSecret:totpSecret,
    backupStorageLimitBytes:positiveInteger('BACKUP_STORAGE_LIMIT_BYTES',5*1024*1024*1024),
    backupMaxBytes:positiveInteger('BACKUP_MAX_BYTES',1024*1024*1024),
    contactRetentionDays:positiveInteger('CONTACT_RETENTION_DAYS',730),
    securityMetadataRetentionDays:positiveInteger('SECURITY_METADATA_RETENTION_DAYS',90),
    auditRetentionDays:positiveInteger('AUDIT_RETENTION_DAYS',730),
    newsletterRetentionDays:positiveInteger('NEWSLETTER_RETENTION_DAYS',365),
    backupOffsiteDir:(source.BACKUP_OFFSITE_DIR||'').trim(),
    alertWebhookUrl:(source.ALERT_WEBHOOK_URL||'').trim()
  };
}

export const env=validateEnvironment();
