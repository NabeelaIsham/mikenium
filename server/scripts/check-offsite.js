import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,stat,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {env} from '../config/env.js';

let probe;
try{
  if(!env.backupOffsiteDir)throw new Error('BACKUP_OFFSITE_DIR is not configured');
  const directory=path.resolve(env.backupOffsiteDir);
  if(!(await stat(directory)).isDirectory())throw new Error('The backup destination is not a directory');
  probe=path.join(directory,`.mikenium-probe-${randomUUID()}`);
  const expected=randomBytes(64);
  await writeFile(probe,expected,{flag:'wx',mode:0o600,flush:true});
  if(!(await readFile(probe)).equals(expected))throw new Error('Backup destination read-back verification failed');
  console.log('Backup destination write/read check passed. External replication must still be verified by the operator.');
}catch(error){console.error(`Backup destination check failed: ${error.message}`);process.exitCode=1}
finally{if(probe)await unlink(probe).catch(error=>{if(error.code!=='ENOENT'){console.error(`Could not remove backup probe: ${error.message}`);process.exitCode=1}})}
