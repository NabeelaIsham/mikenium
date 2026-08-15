import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {stat,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

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
    const fakeToken='a'.repeat(64);
    const confirmationPage=await fetch(`${base}/api/newsletter/confirm?token=${fakeToken}`);assert.equal(confirmationPage.status,200);assert.match(await confirmationPage.text(),/method="post"/);
    const confirmationPost=await fetch(`${base}/api/newsletter/confirm`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`token=${fakeToken}`});assert.equal(confirmationPost.status,400);
    const unsubscribePage=await fetch(`${base}/api/newsletter/unsubscribe?token=${fakeToken}`);assert.equal(unsubscribePage.status,200);assert.match(await unsubscribePage.text(),/method="post"/);
    if(process.env.RUN_DESTRUCTIVE_RESTORE_TESTS==='true'){
      const [{default:bcrypt},{totpAt}]=await Promise.all([import('bcryptjs'),import('../services/totp.js')]);
      const adminId=randomUUID(),password=`CI-${randomUUID()}-Password`;
      await pool.query(`INSERT INTO users(id,name,email,password_hash,role,active,email_verified) VALUES($1,'CI Super Admin',lower($2),$3,'SUPER_ADMIN',true,true)`,[adminId,process.env.SUPER_ADMIN_EMAIL,await bcrypt.hash(password,12)]);
      const counter=Math.floor(Date.now()/30000),code=totpAt(process.env.SUPER_ADMIN_TOTP_SECRET,counter);
      const login=await fetch(`${base}/api/auth/super-admin/login`,{method:'POST',headers:{'Content-Type':'application/json','Origin':'http://localhost:5173','Sec-Fetch-Site':'same-origin','User-Agent':'mikenium-ci'},body:JSON.stringify({email:process.env.SUPER_ADMIN_EMAIL,password,code})});
      assert.equal(login.status,200);
      const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.match(cookie||'',/^admin_session=/);
      const session=await fetch(`${base}/api/auth/super-admin/session`,{headers:{Cookie:cookie,'User-Agent':'mikenium-ci'}});assert.equal(session.status,200);
      const protectedWithSession=await fetch(`${base}/api/admin/users`,{headers:{Cookie:cookie,'User-Agent':'mikenium-ci'}});assert.equal(protectedWithSession.status,200);
      const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpWQAAAAASUVORK5CYII=','base64');
      const upload=await fetch(`${base}/api/admin/projects/image-upload`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'image/png','Origin':'http://localhost:5173','Sec-Fetch-Site':'same-origin','User-Agent':'mikenium-ci'},body:png});assert.equal(upload.status,201);
      const {imageUrl}=await upload.json();
      const uploadedImage=await fetch(`${base}${imageUrl}`);assert.equal(uploadedImage.status,200);assert.match(uploadedImage.headers.get('content-type')||'',/^image\/png/);
      await unlink(path.join(fileURLToPath(new URL('../uploads/',import.meta.url)),imageUrl.replace('/uploads/','')));
      const logout=await fetch(`${base}/api/auth/super-admin/logout`,{method:'POST',headers:{Cookie:cookie,'Origin':'http://localhost:5173','Sec-Fetch-Site':'same-origin','User-Agent':'mikenium-ci'}});assert.equal(logout.status,204);
      const endedSession=await fetch(`${base}/api/auth/super-admin/session`,{headers:{Cookie:cookie,'User-Agent':'mikenium-ci'}});assert.equal(endedSession.status,403);

      const {createBackup,removeBackupFile,restoreBackup}=await import('../services/backup-service.js');
      const id=randomUUID(),original=`CI restore sample ${id}`;
      await pool.query(`INSERT INTO services(id,name,description,status) VALUES($1,$2,$3,'DRAFT')`,[id,`CI service ${id}`,original]);
      const backup=await createBackup({name:'CI restore test',includes:['Database'],type:'MANUAL'});
      await stat(path.join(process.env.BACKUP_OFFSITE_DIR,backup.filename));
      await pool.query('UPDATE services SET description=$2 WHERE id=$1',[id,'Changed after backup']);
      await restoreBackup(backup,null);
      assert.equal((await pool.query('SELECT description FROM services WHERE id=$1',[id])).rows[0]?.description,original);
      const files=(await pool.query("SELECT filename FROM system_backups WHERE name LIKE 'CI restore test%' OR name LIKE 'Safety backup before restoring CI restore test%'")).rows;
      await Promise.all(files.map(row=>removeBackupFile(row.filename)));
      await pool.query("DELETE FROM system_backups WHERE name LIKE 'CI restore test%' OR name LIKE 'Safety backup before restoring CI restore test%'");
      await pool.query('DELETE FROM services WHERE id=$1',[id]);
    }
  }finally{
    await new Promise(resolve=>server.close(resolve));
    await pool.end();
  }
});
