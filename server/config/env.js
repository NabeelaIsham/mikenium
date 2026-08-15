import 'dotenv/config';

const productionRequired=['DATABASE_URL','JWT_SECRET','BACKUP_ENCRYPTION_KEY','SUPER_ADMIN_EMAIL','SUPER_ADMIN_TOTP_SECRET','CLIENT_URL','SMTP_HOST','SMTP_USER','SMTP_PASS','CONTACT_TO_EMAIL','BACKUP_OFFSITE_DIR','ALERT_WEBHOOK_URL'];

export function validateEnvironment(source=process.env){
  const isProduction=source.NODE_ENV==='production';
  const missing=(isProduction?productionRequired:['DATABASE_URL','JWT_SECRET']).filter(key=>!source[key]?.trim());
  if(missing.length)throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  let databaseUrl;
  try{databaseUrl=new URL(source.DATABASE_URL)}catch{throw new Error('DATABASE_URL must be a valid PostgreSQL URL')}
  if(!['postgres:','postgresql:'].includes(databaseUrl.protocol))throw new Error('DATABASE_URL must use the PostgreSQL protocol');
  if((source.JWT_SECRET||'').length<32)throw new Error('JWT_SECRET must contain at least 32 characters');
  if(isProduction&&(source.JWT_SECRET||'').length<64)throw new Error('JWT_SECRET must contain at least 64 characters in production');
  if(isProduction&&source.JWT_SECRET?.toLowerCase().includes('replace'))throw new Error('JWT_SECRET must not use the example value');
  const clientOrigins=(source.CLIENT_URL||(isProduction?'':'http://localhost:5173')).split(',').map(value=>{
    try{
      const url=new URL(value.trim());
      if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error();
      if(isProduction&&url.protocol!=='https:')throw new Error();
      if(!['http:','https:'].includes(url.protocol))throw new Error();
      return url.origin;
    }catch{throw new Error(`CLIENT_URL must contain valid ${isProduction?'HTTPS ':''}origins without paths, credentials, queries, or fragments`)}
  });
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
  const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(isProduction&&!emailPattern.test(source.SUPER_ADMIN_EMAIL||''))throw new Error('SUPER_ADMIN_EMAIL must be a valid email address');
  if(isProduction&&!emailPattern.test(source.CONTACT_TO_EMAIL||''))throw new Error('CONTACT_TO_EMAIL must be a valid email address');
  if(isProduction&&!/^\//.test(source.BACKUP_OFFSITE_DIR||''))throw new Error('BACKUP_OFFSITE_DIR must be an absolute Linux path');
  const smtpPort=Number(source.SMTP_PORT||465);
  if(!Number.isSafeInteger(smtpPort)||smtpPort<1||smtpPort>65535)throw new Error('SMTP_PORT must be an integer between 1 and 65535');
  if(source.SMTP_SECURE&&!['true','false'].includes(source.SMTP_SECURE.toLowerCase()))throw new Error('SMTP_SECURE must be true or false');
  const positiveInteger=(key,fallback)=>{
    const value=Number(source[key]||fallback);
    if(!Number.isSafeInteger(value)||value<=0)throw new Error(`${key} must be a positive integer`);
    return value;
  };
  if(isProduction&&source.ALERT_WEBHOOK_URL){
    try{if(new URL(source.ALERT_WEBHOOK_URL).protocol!=='https:')throw new Error()}catch{throw new Error('ALERT_WEBHOOK_URL must be a valid HTTPS URL')}
  }
  const port=Number(source.PORT||5000);
  if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('PORT must be an integer between 1 and 65535');
  return {
    nodeEnv:source.NODE_ENV||'development',
    isProduction,
    port,
    databaseUrl:source.DATABASE_URL,
    jwtSecret:source.JWT_SECRET,
    clientOrigins:[...new Set(clientOrigins)],
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
