import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment} from '../config/env.js';

const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://user:pass@db/app',JWT_SECRET:'a'.repeat(64),BACKUP_ENCRYPTION_KEY:'b'.repeat(64),SUPER_ADMIN_EMAIL:'admin@example.com',SUPER_ADMIN_TOTP_SECRET:'JBSWY3DPEHPK3PXP',CLIENT_URL:'https://example.com',SMTP_HOST:'smtp.example.com',SMTP_USER:'mailer@example.com',SMTP_PASS:'secret',CONTACT_TO_EMAIL:'contact@example.com',BACKUP_OFFSITE_DIR:'/mnt/offsite',ALERT_WEBHOOK_URL:'https://alerts.example.com'};

test('accepts a complete production environment',()=>{
  const result=validateEnvironment(valid);
  assert.equal(result.isProduction,true);
  assert.deepEqual(result.clientOrigins,['https://example.com']);
  assert.equal(validateEnvironment({...valid,ALERT_WEBHOOK_URL:''}).alertEmail,'contact@example.com');
});

test('rejects missing production secrets',()=>{
  assert.throws(()=>validateEnvironment({...valid,JWT_SECRET:''}),/JWT_SECRET/);
});

test('rejects non-HTTPS production origins',()=>{
  assert.throws(()=>validateEnvironment({...valid,CLIENT_URL:'http://example.com'}),/HTTPS/);
  assert.throws(()=>validateEnvironment({...valid,CLIENT_URL:'https://example.com/admin'}),/origins without paths/);
  assert.throws(()=>validateEnvironment({...valid,CLIENT_URL:'https://user:pass@example.com'}),/origins without paths/);
  assert.deepEqual(validateEnvironment({...valid,CLIENT_URL:'https://example.com/'}).clientOrigins,['https://example.com']);
});

test('requires PostgreSQL URLs and valid ports',()=>{
  assert.throws(()=>validateEnvironment({...valid,DATABASE_URL:'https://db.example.com/app'}),/PostgreSQL protocol/);
  assert.throws(()=>validateEnvironment({...valid,DATABASE_URL:'not-a-url'}),/valid PostgreSQL URL/);
  assert.throws(()=>validateEnvironment({...valid,PORT:'70000'}),/PORT/);
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
  assert.throws(()=>validateEnvironment({...valid,ALERT_WEBHOOK_URL:'https://'}),/ALERT_WEBHOOK_URL/);
  assert.throws(()=>validateEnvironment({...valid,SUPER_ADMIN_EMAIL:'invalid'}),/SUPER_ADMIN_EMAIL/);
  assert.throws(()=>validateEnvironment({...valid,CONTACT_TO_EMAIL:'invalid'}),/CONTACT_TO_EMAIL/);
  assert.throws(()=>validateEnvironment({...valid,BACKUP_OFFSITE_DIR:'relative/backups'}),/BACKUP_OFFSITE_DIR/);
  assert.throws(()=>validateEnvironment({...valid,SMTP_PORT:'70000'}),/SMTP_PORT/);
  assert.throws(()=>validateEnvironment({...valid,SMTP_SECURE:'sometimes'}),/SMTP_SECURE/);
  const result=validateEnvironment({...valid,BACKUP_MAX_BYTES:'1024',BACKUP_STORAGE_LIMIT_BYTES:'2048',ALERT_WEBHOOK_URL:'https://alerts.example.test'});
  assert.equal(result.backupMaxBytes,1024);assert.equal(result.backupStorageLimitBytes,2048);
});
