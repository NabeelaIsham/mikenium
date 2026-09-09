import {constants} from 'node:fs';
import {chmod,copyFile} from 'node:fs/promises';

for(const [source,target] of [['.env.production.example','.env.production'],['.production-approvals.example.json','.production-approvals.json']]){
  try{
    await copyFile(source,target,constants.COPYFILE_EXCL);
    await chmod(target,0o600);
    console.log(`Created ${target}`);
  }catch(error){if(error.code==='EEXIST')console.log(`Preserved existing ${target}`);else throw error}
}
console.log('Populate the configuration with your existing deployment values. Keep approvals false until the corresponding review or drill is complete. Then run npm run release:check.');
