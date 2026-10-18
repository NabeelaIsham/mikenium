import test from 'node:test';
import assert from 'node:assert/strict';
import {isSafePublicUrl,publicUrlOr} from '../utils/safe-url.js';
import {validateImageUpload} from '../utils/image-upload.js';
import {findTotpCounter,totpAt} from '../services/totp.js';
import {csvCell} from '../utils/csv.js';
import {readSessionCookie} from '../utils/session-cookie.js';

test('malformed, oversized and ambiguous session cookies fail closed',()=>{
  assert.equal(readSessionCookie('other=hello; admin_session=abc.def.ghi','admin_session'),'abc.def.ghi');
  for(const header of ['admin_session=%','admin_session=%E0%A4%A','admin_session=','admin_session=one; admin_session=two',`admin_session=${'x'.repeat(4097)}`]){
    assert.equal(readSessionCookie(header,'admin_session'),undefined);
  }
  assert.equal(readSessionCookie(undefined,'admin_session'),undefined);
});

test('public URLs reject active and protocol-relative schemes',()=>{
  assert.equal(isSafePublicUrl('javascript:alert(1)'),false);
  assert.equal(isSafePublicUrl('data:text/html,test'),false);
  assert.equal(isSafePublicUrl('//attacker.example/path'),false);
  assert.equal(isSafePublicUrl('http://attacker.example/path'),false);
  assert.equal(isSafePublicUrl('https://user:pass@example.com/path'),false);
  assert.equal(isSafePublicUrl('http://localhost:5000/uploads/test.png'),true);
  assert.equal(isSafePublicUrl('/contact'),true);
  assert.equal(isSafePublicUrl('https://mikenium.com'),true);
  assert.equal(publicUrlOr('javascript:alert(1)','/contact'),'/contact');
  for(const value of ['/\\attacker.example','/\n/attacker.example','/\t/attacker.example','https://example.com/\\path'])assert.equal(isSafePublicUrl(value),false);
});

test('image validation checks file signatures rather than MIME alone',()=>{
  const types={'image/png':'png'};
  assert.equal(validateImageUpload(Buffer.from('<script>alert(1)</script>'),'image/png',types),null);
  assert.equal(validateImageUpload(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),'image/png',types),'png');
});

test('TOTP accepts the current counter and rejects invalid codes',()=>{
  const secret='JBSWY3DPEHPK3PXP';const now=1_700_000_000_000;const counter=Math.floor(now/1000/30);
  assert.equal(totpAt('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',1,8),'94287082');
  assert.equal(findTotpCounter(secret,totpAt(secret,counter),{now}),counter);
  assert.equal(findTotpCounter(secret,'000000',{now}),null);
});

test('CSV export neutralizes spreadsheet formulas',()=>{
  assert.equal(csvCell('=HYPERLINK("https://evil.example")'),'"\'=HYPERLINK(""https://evil.example"")"');
  assert.equal(csvCell('normal'),'"normal"');
});
