import test from 'node:test';
import assert from 'node:assert/strict';
import {parseImageOrigins,securityPolicy} from '../config/security-policy.js';

test('CSP excludes broad remote sources and unsafe inline styles',()=>{
  const {useDefaults,directives}=securityPolicy({isProduction:true});
  assert.equal(useDefaults,false);
  assert.deepEqual(directives.styleSrc,["'self'"]);
  assert.deepEqual(directives.styleSrcAttr,["'none'"]);
  assert.deepEqual(directives.fontSrc,["'self'"]);
  for(const sources of Object.values(directives))for(const source of sources||[]){
    assert.ok(!source.includes('*'));
    assert.ok(!['https:','http:',"'unsafe-inline'","'unsafe-eval'"].includes(source));
  }
  assert.deepEqual(directives.upgradeInsecureRequests,[]);
  assert.equal(securityPolicy().directives.upgradeInsecureRequests,null);
});

test('external images require explicit HTTPS origins',()=>{
  assert.deepEqual(parseImageOrigins(),[]);
  const origins=parseImageOrigins('https://media.example.test/, https://media.example.test');
  assert.deepEqual(origins,['https://media.example.test']);
  assert.ok(securityPolicy({cspImageOrigins:origins}).directives.imgSrc.includes(origins[0]));
  for(const value of ['https:','*','https://*.example.test','http://example.test','https://user:pass@example.test','https://example.test/images','https://example.test?x=1','https://example.test/#hash','https://example.test;style-src','https://example.test%3Bstyle-src'])assert.throws(()=>parseImageOrigins(value),/CSP_IMAGE_ORIGINS/);
});
