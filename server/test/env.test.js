import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment} from '../config/env.js';

const valid={NODE_ENV:'production',DATABASE_URL:'postgresql://user:pass@db/app',JWT_SECRET:'a'.repeat(64),BACKUP_ENCRYPTION_KEY:'b'.repeat(64),SUPER_ADMIN_EMAIL:'admin@example.com',CLIENT_URL:'https://example.com'};

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
