import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

test('every admin route rejects anonymous and malformed sessions before database access',async()=>{
  // Isolated process: never connect to the project's database or send alerts.
  Object.assign(process.env,{NODE_ENV:'test',DOTENV_CONFIG_PATH:'__unused_security_test_env__',DATABASE_URL:'postgresql://test:test@127.0.0.1:1/test',JWT_SECRET:'security-test-secret-'.repeat(4),SMTP_USER:'',SMTP_PASS:'',SUPER_ADMIN_EMAIL:'',ALERT_WEBHOOK_URL:'',CLIENT_URL:'http://localhost:5173'});
  const [{default:app},{pool}]=await Promise.all([import('../app.js'),import('../config/db.js')]);
  let databaseCalls=0;
  pool.query=async()=>{databaseCalls++;throw new Error('Unexpected database access');};
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const routes=['settings','dashboard','users','clients','projects','services','products','pricing','blogs','testimonials','partners','contact-messages','activity-logs','system-backups'];
    for(const route of routes){
      const response=await fetch(`${base}/api/admin/${route}`);
      assert.equal(response.status,401,route);
      assert.match(response.headers.get('cache-control'),/no-store/);
    }
    for(const cookie of ['admin_session=%','admin_session=%E0%A4%A','admin_session=one; admin_session=two']){
      const response=await fetch(`${base}/api/auth/super-admin/session`,{headers:{Cookie:cookie}});
      assert.equal(response.status,401,'Malformed cookies must not produce 500 responses or alerts');
    }
    const forged=await fetch(`${base}/api/admin/blogs`,{headers:{Cookie:'admin_session=forged.jwt.value'}});
    assert.equal(forged.status,403);
    const csrf=await fetch(`${base}/api/admin/blogs`,{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'});
    assert.equal(csrf.status,403);
    for(const path of ['/api/admin/blogs/image-upload','/api/admin/projects/image-upload',`/api/admin/system-backups/${randomUUID()}/restore`]){
      const response=await fetch(`${base}${path}`,{method:'POST',headers:{Origin:'http://localhost:5173'}});
      assert.equal(response.status,401,path);
    }
    assert.equal(databaseCalls,0);
  }finally{
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    await pool.end();
  }
});
