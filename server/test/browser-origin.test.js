import test from 'node:test';
import assert from 'node:assert/strict';
import {isTrustedBrowserRequest} from '../middleware/browser-origin.js';

const allowed=['https://mikenium.example'];
test('browser-origin policy allows reads and same-origin mutations',()=>{
  assert.equal(isTrustedBrowserRequest({method:'GET'},allowed,true),true);
  assert.equal(isTrustedBrowserRequest({method:'POST',origin:allowed[0],fetchSite:'same-origin'},allowed,true),true);
  assert.equal(isTrustedBrowserRequest({method:'DELETE',referer:`${allowed[0]}/admin`},allowed,true),true);
});

test('browser-origin policy rejects cross-site and unverifiable production mutations',()=>{
  assert.equal(isTrustedBrowserRequest({method:'POST',origin:'https://evil.example',fetchSite:'cross-site'},allowed,true),false);
  assert.equal(isTrustedBrowserRequest({method:'PATCH'},allowed,true),false);
  assert.equal(isTrustedBrowserRequest({method:'POST',referer:'not a url'},allowed,true),false);
});

test('browser-origin policy permits loopback aliases and ports only in development',()=>{
  const localAllowed=['http://localhost:5173'];
  assert.equal(isTrustedBrowserRequest({method:'POST',origin:'http://127.0.0.1:5173',fetchSite:'same-site'},localAllowed,false),true);
  assert.equal(isTrustedBrowserRequest({method:'POST',referer:'http://[::1]:4173/admin',fetchSite:'same-site'},localAllowed,false),true);
  assert.equal(isTrustedBrowserRequest({method:'POST',origin:'http://127.0.0.1:5173',fetchSite:'same-site'},localAllowed,true),false);
  assert.equal(isTrustedBrowserRequest({method:'POST',origin:'https://evil.example',fetchSite:'cross-site'},localAllowed,false),false);
});
