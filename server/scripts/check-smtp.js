import 'dotenv/config';

try{
  const {verifyMailTransport}=await import('../services/mailer.js');
  await verifyMailTransport();
  console.log('SMTP authentication and TLS connection verified.');
}catch(error){
  console.error(`SMTP verification failed: ${error.message}`);
  process.exitCode=1;
}
