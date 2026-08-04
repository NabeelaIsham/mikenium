import test from 'node:test';
import assert from 'node:assert/strict';

test('production HTTP and database smoke test',{skip:process.env.RUN_INTEGRATION_TESTS!=='true'},async()=>{
  const [{default:app},{pool},{runMigrations}]=await Promise.all([
    import('../app.js'),import('../config/db.js'),import('../services/migrations.js')
  ]);
  await runMigrations({logger:{log(){}}});
  const server=app.listen(0,'127.0.0.1');
  await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject)});
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    const health=await fetch(`${base}/api/health`);assert.equal(health.status,200);assert.equal((await health.json()).status,'ok');
    const ready=await fetch(`${base}/api/ready`);assert.equal(ready.status,200);assert.equal((await ready.json()).database,'ok');
    const settings=await fetch(`${base}/api/settings`);assert.equal(settings.status,200);assert.ok((await settings.json()).settings);
    const protectedRoute=await fetch(`${base}/api/admin/users`);assert.equal(protectedRoute.status,401);
    const invalidContact=await fetch(`${base}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(invalidContact.status,400);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    await pool.end();
  }
});
