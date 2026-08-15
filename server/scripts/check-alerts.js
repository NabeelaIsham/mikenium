import 'dotenv/config';

try{
  const {sendOperationalAlert}=await import('../services/alerts.js');
  const delivered=await sendOperationalAlert('TEST_ALERT',{description:'Manual production alert-delivery test'});
  if(!delivered)throw new Error('No alert channel accepted the test');
  console.log('Operational test alert delivered. Confirm receipt in the monitored channel.');
}catch(error){
  console.error(`Operational alert test failed: ${error.message}`);
  process.exitCode=1;
}
