import test from 'node:test';
import assert from 'node:assert/strict';
import {assertBackupCapacity,decryptBackup,encryptBackup} from '../services/backup-service.js';

const key=Buffer.alloc(32,7);

test('backup encryption round-trips without exposing plaintext',()=>{
  const plain=JSON.stringify({users:[{email:'private@example.com'}]});
  const encrypted=encryptBackup(plain,key);
  assert.equal(encrypted.includes('private@example.com'),false);
  assert.equal(decryptBackup(encrypted,key),plain);
});

test('backup encryption detects tampering',()=>{
  const envelope=JSON.parse(encryptBackup('{"safe":true}',key));
  envelope.data=`A${envelope.data.slice(1)}`;
  assert.throws(()=>decryptBackup(JSON.stringify(envelope),key));
});

test('backup capacity rejects oversized files and exhausted storage',()=>{
  assert.doesNotThrow(()=>assertBackupCapacity(100,200,{maxBytes:100,storageLimitBytes:300}));
  assert.throws(()=>assertBackupCapacity(101,0,{maxBytes:100,storageLimitBytes:1000}),/BACKUP_MAX_BYTES/);
  assert.throws(()=>assertBackupCapacity(100,201,{maxBytes:1000,storageLimitBytes:300}),/storage limit/);
});
