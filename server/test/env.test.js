import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment} from '../config/env.js';

const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://user:pass@db/app',JWT_SECRET:'a'.repeat(64),BACKUP_ENCRYPTION_KEY:'b'.repeat(64),SUPER_ADMIN_EMAIL:'admin@example.com',SUPER_ADMIN_TOTP_SECRET:'JBSWY3DPEHPK3PXP',CLIENT_URL:'https://example.com',SMTP_HOST:'smtp.example.com',SMTP_USER:'mailer@example.com',SMTP_PASS:'secret',CONTACT_TO_EMAIL:'contact@example.com',BACKUP_OFFSITE_DIR:'/mnt/offsite',ALERT_WEBHOOK_URL:'https://alerts.example.com'};

test('accepts a complete production environment',()=>{
  const result=validateEnvironment(valid);
  assert.equal(result.isProduction,true);
  assert.deepEqual(result.clientOrigins,['https://example.com']);
});

test('rejects missing production secrets',()=>{
  assert.throws(()=>validateEnvironment({...valid,JWT_SECRET:''}),/JWT_SECRET/);
});

test('rejects non-HTTPS production origins',()=>{
  assert.throws(()=>validateEnvironment({...valid,CLIENT_URL:'http://example.com'}),/HTTPS/);
});

test('rejects malformed backup keys',()=>{
  assert.throws(()=>validateEnvironment({...valid,BACKUP_ENCRYPTION_KEY:'short'}),/BACKUP_ENCRYPTION_KEY/);
});

test('requires a valid production MFA secret',()=>{
  assert.throws(()=>validateEnvironment({...valid,SUPER_ADMIN_TOTP_SECRET:''}),/SUPER_ADMIN_TOTP_SECRET/);
  assert.throws(()=>validateEnvironment({...valid,SUPER_ADMIN_TOTP_SECRET:'not-base32'}),/SUPER_ADMIN_TOTP_SECRET/);
  assert.throws(()=>validateEnvironment({...valid,SUPER_ADMIN_TOTP_SECRET:'REPLACEWITHABASE32SECRET'}),/SUPER_ADMIN_TOTP_SECRET/);
});

test('validates production operational settings',()=>{
  assert.throws(()=>validateEnvironment({...valid,BACKUP_MAX_BYTES:'0'}),/BACKUP_MAX_BYTES/);
  assert.throws(()=>validateEnvironment({...valid,ALERT_WEBHOOK_URL:'http://alerts.example.test'}),/ALERT_WEBHOOK_URL/);
  const result=validateEnvironment({...valid,BACKUP_MAX_BYTES:'1024',BACKUP_STORAGE_LIMIT_BYTES:'2048',ALERT_WEBHOOK_URL:'https://alerts.example.test'});
  assert.equal(result.backupMaxBytes,1024);assert.equal(result.backupStorageLimitBytes,2048);
});
