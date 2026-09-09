import {spawn} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';

// Never use the application's .env or restore into its database. The supplied
// connection is used only to create and drop a uniquely named disposable DB.
const connectionString=process.env.TEST_DATABASE_URL;
if(!connectionString){
  console.error('Set TEST_DATABASE_URL to a PostgreSQL connection with CREATE DATABASE permission. This command creates, tests, and drops its own disposable database; it never uses server/.env.');
  process.exit(1);
}
const admin=new pg.Client({connectionString,connectionTimeoutMillis:5000});
const database=`mikenium_test_${randomUUID().replaceAll('-','')}`;
let created=false,temporaryDirectory;
try{
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  created=true;
  temporaryDirectory=await mkdtemp(path.join(tmpdir(),'mikenium-integration-'));
  const url=new URL(connectionString);url.pathname=`/${database}`;
  const childEnv={...process.env};
  for(const key of Object.keys(childEnv))if(/^(SMTP_|ALERT_|CONTACT_TO_EMAIL$|DOTENV_)/.test(key))delete childEnv[key];
  Object.assign(childEnv,{
    NODE_ENV:'test',DATABASE_URL:url.href,
    DOTENV_CONFIG_PATH:path.join(temporaryDirectory,'unused.env'),
    JWT_SECRET:randomBytes(48).toString('hex'),
    BACKUP_ENCRYPTION_KEY:randomBytes(32).toString('hex'),
    SUPER_ADMIN_EMAIL:'admin@example.test',SUPER_ADMIN_TOTP_SECRET:'JBSWY3DPEHPK3PXP',
    CLIENT_URL:'http://localhost:5173',RUN_INTEGRATION_TESTS:'true',
    RUN_DESTRUCTIVE_RESTORE_TESTS:'true',BACKUP_OFFSITE_DIR:temporaryDirectory,
    STATIC_DIR:fileURLToPath(new URL('../../client/dist/',import.meta.url)),
    RUN_BROWSER_TESTS:process.argv.includes('--browser')?'true':'false'
  });
  console.log('Running integration tests in a disposable PostgreSQL database. External email and alerts are disabled.');
  const child=spawn(process.execPath,['--test','--test-concurrency=1','test/integration.test.js'],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),env:childEnv,stdio:'inherit',windowsHide:true
  });
  process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1))});
}catch(error){console.error(`Integration check failed: ${error.message}`);process.exitCode=1}
finally{
  if(created)await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`).catch(error=>{console.error(`Could not remove disposable database ${database}: ${error.message}`);process.exitCode=1});
  await admin.end().catch(()=>{});
  if(temporaryDirectory)await rm(temporaryDirectory,{recursive:true,force:true});
}
