import app from './app.js';
import {pool} from './config/db.js';
import {env} from './config/env.js';

const server=app.listen(env.port,()=>console.log(`Mikenium API listening on port ${env.port} (${env.nodeEnv})`));
let shuttingDown=false;
async function shutdown(signal){
  if(shuttingDown)return;
  shuttingDown=true;
  console.log(`${signal} received; shutting down`);
  const force=setTimeout(()=>process.exit(1),10000);force.unref();
  server.close(async error=>{
    try{await pool.end()}finally{
      clearTimeout(force);
      if(error)console.error(error);
      process.exit(error?1:0);
    }
  });
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
process.on('unhandledRejection',error=>{console.error('Unhandled rejection:',error);shutdown('unhandledRejection')});
process.on('uncaughtException',error=>{console.error('Uncaught exception:',error);shutdown('uncaughtException')});
