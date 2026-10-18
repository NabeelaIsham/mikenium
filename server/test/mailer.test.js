import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';

test('patched mailer composes messages without contacting SMTP and retains TLS checks',async t=>{
  Object.assign(process.env,{SMTP_HOST:'smtp.example.test',SMTP_PORT:'587',SMTP_SECURE:'false',SMTP_USER:'sender@example.test',SMTP_PASS:'test-only',CONTACT_TO_EMAIL:'contact@example.test'});
  const offline=nodemailer.createTransport({streamTransport:true,buffer:true,newline:'unix'});
  let options;
  t.mock.method(nodemailer,'createTransport',value=>{options=value;return offline;});
  const mailer=await import('../services/mailer.js');
  const message=await mailer.sendContactNotification({senderName:'<script>bad</script>',senderEmail:'visitor@example.test',subject:'Enquiry\r\nBcc: attacker@example.test',message:'<img src=x onerror=bad>',company:'Example',notificationEmail:'contact@example.test'});
  const mime=message.message.toString();
  assert.match(mime,/&lt;script&gt;/);
  assert.doesNotMatch(mime,/\r?\nBcc: attacker/);
  assert.equal(options.requireTLS,true);
  assert.equal(options.tls.rejectUnauthorized,true);
  assert.equal(options.tls.minVersion,'TLSv1.2');
  await mailer.sendContactReply({to:'visitor@example.test',name:'Visitor',subject:'Hello',body:'A reply'});
  await mailer.sendNewsletterConfirmation('visitor@example.test','https://example.test/confirm?token=test','https://example.test/unsubscribe?token=test');
  await mailer.sendOperationalAlertEmail({event:'TEST',timestamp:'test',details:{test:true}});
});
