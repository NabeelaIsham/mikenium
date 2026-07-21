import 'dotenv/config';

const productionRequired=['DATABASE_URL','JWT_SECRET','BACKUP_ENCRYPTION_KEY','SUPER_ADMIN_EMAIL'];

export function validateEnvironment(source=process.env){
  const isProduction=source.NODE_ENV==='production';
  const missing=(isProduction?productionRequired:['DATABASE_URL','JWT_SECRET']).filter(key=>!source[key]?.trim());
  if(missing.length)throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if((source.JWT_SECRET||'').length<32)throw new Error('JWT_SECRET must contain at least 32 characters');
  if(isProduction&&source.JWT_SECRET?.toLowerCase().includes('replace'))throw new Error('JWT_SECRET must not use the example value');
  if(isProduction&&source.CLIENT_URL&&!source.CLIENT_URL.split(',').every(value=>value.trim().startsWith('https://')))throw new Error('CLIENT_URL must use HTTPS in production');
  if(source.BACKUP_ENCRYPTION_KEY){
    const value=source.BACKUP_ENCRYPTION_KEY.trim();
    const validHex=/^[a-f0-9]{64}$/i.test(value);
    let validBase64=false;
    try{validBase64=Buffer.from(value,'base64').length===32}catch{}
    if(!validHex&&!validBase64)throw new Error('BACKUP_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or base64');
  }
  return {
    nodeEnv:source.NODE_ENV||'development',
    isProduction,
    port:Number(source.PORT||5000),
    databaseUrl:source.DATABASE_URL,
    jwtSecret:source.JWT_SECRET,
    clientOrigins:(source.CLIENT_URL||(isProduction?'':'http://localhost:5173')).split(',').map(value=>value.trim()).filter(Boolean),
    staticDir:source.STATIC_DIR||'',
    backupEncryptionKey:source.BACKUP_ENCRYPTION_KEY||''
  };
}

export const env=validateEnvironment();
