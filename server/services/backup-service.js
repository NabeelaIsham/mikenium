import {mkdir,readFile,readdir,stat,unlink,writeFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import path from 'path';
import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'crypto';
import {pool} from '../config/db.js';
import {env} from '../config/env.js';

export const backupPath=fileURLToPath(new URL('../backups/',import.meta.url));
const uploadsPath=fileURLToPath(new URL('../uploads/',import.meta.url));
const tables=['users','site_settings','services','clients','projects','products','pricing_plans','blog_posts','testimonials','contact_messages','contact_message_replies','newsletter_subscribers','partners','admin_audit_logs'];

function encryptionKey(){
  if(!env.backupEncryptionKey)throw new Error('BACKUP_ENCRYPTION_KEY is required to create or restore backups');
  return /^[a-f0-9]{64}$/i.test(env.backupEncryptionKey)?Buffer.from(env.backupEncryptionKey,'hex'):Buffer.from(env.backupEncryptionKey,'base64');
}
export function encryptBackup(plainText,key=encryptionKey()){
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([cipher.update(plainText,'utf8'),cipher.final()]);
  return JSON.stringify({version:2,algorithm:'aes-256-gcm',iv:iv.toString('base64'),authTag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')});
}
export function decryptBackup(content,key=encryptionKey()){
  const envelope=JSON.parse(content);
  if(envelope.version!==2)return content;
  if(envelope.algorithm!=='aes-256-gcm')throw new Error('Unsupported backup encryption format');
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
  decipher.setAuthTag(Buffer.from(envelope.authTag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(envelope.data,'base64')),decipher.final()]).toString('utf8');
}
function backupFile(filename){
  if(!filename||path.basename(filename)!==filename)throw new Error('Invalid backup filename');
  return path.join(backupPath,filename);
}
async function filesIn(directory,root=directory){
  const output=[];
  for(const entry of await readdir(directory,{withFileTypes:true}).catch(()=>[])){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())output.push(...await filesIn(full,root));
    else{
      const info=await stat(full);
      if(info.size<=10*1024*1024)output.push({path:path.relative(root,full).replaceAll('\\','/'),data:(await readFile(full)).toString('base64')});
    }
  }
  return output;
}

export async function createBackup({name='',includes=['Database'],type='MANUAL',userId=null}){
  await mkdir(backupPath,{recursive:true});
  const id=randomUUID(),filename=`backup-${new Date().toISOString().replace(/[:.]/g,'-')}-${id.slice(0,8)}.backup`;
  await pool.query(`INSERT INTO system_backups(id,name,description,backup_type,includes,filename,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,name||`${type==='SCHEDULED'?'Scheduled':'Manual'} Backup - ${new Date().toLocaleString('en-GB')}`,`${includes.join(', ')} backup`,type,includes,filename,userId]);
  try{
    const payload={version:1,createdAt:new Date().toISOString(),includes,database:{},uploads:[]};
    if(includes.includes('Database'))for(const table of tables)payload.database[table]=(await pool.query(`SELECT * FROM ${table}`)).rows;
    if(includes.some(value=>value==='Files'||value==='Media Library'))payload.uploads=await filesIn(uploadsPath);
    const content=encryptBackup(JSON.stringify(payload));
    await writeFile(backupFile(filename),content,{flag:'wx',mode:0o600});
    const {rows}=await pool.query(`UPDATE system_backups SET size_bytes=$2,status='SUCCESS' WHERE id=$1 RETURNING *`,[id,Buffer.byteLength(content)]);
    return rows[0];
  }catch(error){
    await pool.query(`UPDATE system_backups SET status='FAILED',error_message=$2 WHERE id=$1`,[id,error.message.slice(0,1000)]);
    throw error;
  }
}

export async function restoreBackup(record,userId){
  const payload=JSON.parse(decryptBackup(await readFile(backupFile(record.filename),'utf8')));
  if(!payload.database||!Object.keys(payload.database).length)throw new Error('This backup does not contain database data');
  await createBackup({name:`Safety backup before restoring ${record.name}`,includes:['Database'],type:'SAFETY',userId});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    for(const table of [...tables].reverse())await client.query(`DELETE FROM ${table}`);
    for(const table of tables){
      const rows=payload.database[table]||[];
      if(rows.length)await client.query(`INSERT INTO ${table} SELECT * FROM json_populate_recordset(NULL::${table},$1::json)`,[JSON.stringify(rows)]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('admin_audit_logs','id'),COALESCE((SELECT max(id) FROM admin_audit_logs),1),true)`);
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
  if(Array.isArray(payload.uploads))for(const file of payload.uploads){
    const target=path.resolve(uploadsPath,file.path);
    if(!target.startsWith(path.resolve(uploadsPath)+path.sep))continue;
    await mkdir(path.dirname(target),{recursive:true});
    await writeFile(target,Buffer.from(file.data,'base64'));
  }
  await pool.query(`UPDATE system_backups SET status='RESTORED',restored_at=now() WHERE id=$1`,[record.id]);
  await pool.query('INSERT INTO admin_audit_logs(user_id,action,metadata) VALUES($1,$2,$3)',[userId,'BACKUP_RESTORED',JSON.stringify({description:`Restored backup ${record.name}`,backupId:record.id})]);
}

export async function removeBackupFile(filename){await unlink(backupFile(filename)).catch(error=>{if(error.code!=='ENOENT')throw error})}
function nextRun(frequency,runTime,from=new Date()){const [hour,minute]=String(runTime).slice(0,5).split(':').map(Number);const next=new Date(from);next.setHours(hour,minute,0,0);if(next<=from)next.setDate(next.getDate()+1);if(frequency==='WEEKLY')while(next.getDay()!==1)next.setDate(next.getDate()+1);if(frequency==='MONTHLY'){next.setDate(1);if(next<=from)next.setMonth(next.getMonth()+1)}return next}
export const calculateNextRun=nextRun;
async function scheduledTick(){
  const lockClient=await pool.connect();let locked=false;
  try{
    locked=(await lockClient.query('SELECT pg_try_advisory_lock(7483921) locked')).rows[0].locked;
    if(!locked)return;
    const {rows}=await pool.query(`SELECT * FROM backup_schedule WHERE id=1 AND enabled AND next_run_at<=now()`);const schedule=rows[0];if(!schedule)return;
    try{
      await createBackup({includes:schedule.include_items,type:'SCHEDULED'});
      await pool.query(`UPDATE backup_schedule SET last_run_at=now(),next_run_at=$1 WHERE id=1`,[nextRun(schedule.frequency,schedule.run_time)]);
      const expired=await pool.query(`DELETE FROM system_backups WHERE backup_type='SCHEDULED' AND created_at<now()-($1||' days')::interval RETURNING filename`,[schedule.retention_days]);
      await Promise.all(expired.rows.map(row=>removeBackupFile(row.filename)));
    }catch(error){console.error('Scheduled backup failed:',error.message)}
  }finally{
    if(locked)await lockClient.query('SELECT pg_advisory_unlock(7483921)').catch(()=>{});
    lockClient.release();
  }
}
setInterval(()=>scheduledTick().catch(error=>console.error('Backup scheduler failed:',error.message)),60000).unref();
