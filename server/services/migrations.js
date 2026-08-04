import {createHash} from 'node:crypto';
import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {pool} from '../config/db.js';

const databasePath=fileURLToPath(new URL('../../database/',import.meta.url));
const migrationsPath=path.join(databasePath,'migrations');
const checksum=sql=>createHash('sha256').update(sql).digest('hex');

export async function migrationPlan(){
  const files=['schema.sql'];
  const incremental=(await readdir(migrationsPath).catch(error=>error.code==='ENOENT'?[]:Promise.reject(error)))
    .filter(name=>/^\d{4}_[a-z0-9_-]+\.sql$/i.test(name)).sort();
  for(const name of incremental)files.push(path.join('migrations',name));
  return Promise.all(files.map(async(relativePath)=>{
    const sql=await readFile(path.join(databasePath,relativePath),'utf8');
    const id=relativePath==='schema.sql'?'0000_baseline':path.basename(relativePath,'.sql');
    return {id,relativePath,sql,checksum:checksum(sql)};
  }));
}

export async function runMigrations({db=pool,logger=console}={}){
  const client=await db.connect();
  try{
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)',[7483920]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations(
      id varchar(160) PRIMARY KEY,
      checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied=new Map((await client.query('SELECT id,checksum FROM schema_migrations')).rows.map(row=>[row.id,row.checksum.trim()]));
    const completed=[];
    for(const migration of await migrationPlan()){
      const prior=applied.get(migration.id);
      if(prior&&prior!==migration.checksum)throw new Error(`Migration ${migration.id} was modified after it was applied`);
      if(prior)continue;
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations(id,checksum) VALUES($1,$2)',[migration.id,migration.checksum]);
      completed.push(migration.id);
    }
    await client.query('COMMIT');
    for(const id of completed)logger.log(`Applied database migration: ${id}`);
    return completed;
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{client.release()}
}
