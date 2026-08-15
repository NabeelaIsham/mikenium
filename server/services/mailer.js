import nodemailer from 'nodemailer';

const host=process.env.SMTP_HOST||'mail.privateemail.com';
const port=Number(process.env.SMTP_PORT||465);
const secure=String(process.env.SMTP_SECURE??port===465).toLowerCase()==='true';
const user=process.env.SMTP_USER||process.env.SUPER_ADMIN_EMAIL;
const pass=process.env.SMTP_PASS;
const contactTo=process.env.CONTACT_TO_EMAIL||process.env.SUPER_ADMIN_EMAIL||user;
const alertTo=process.env.ALERT_TO_EMAIL||contactTo;

let transporter;
function getTransporter(){
  if(!user||!pass)throw new Error('SMTP credentials are not configured');
  transporter ||= nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS:!secure,
    auth:{user,pass},
    tls:{minVersion:'TLSv1.2',rejectUnauthorized:true},
    connectionTimeout:15000,
    greetingTimeout:15000,
    socketTimeout:20000
  });
  return transporter;
}

export function verifyMailTransport(){
  return getTransporter().verify();
}

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const lines=value=>escapeHtml(value).replace(/\r?\n/g,'<br>');
const headerText=value=>String(value??'').replace(/[\r\n]/g,' ').trim();

export async function sendOperationalAlertEmail({event,timestamp,details}){
  const detailText=JSON.stringify(details||{},null,2);
  return getTransporter().sendMail({
    from:{name:'Mikenium Operations',address:user},
    to:alertTo,
    replyTo:user,
    subject:headerText(`[Mikenium alert] ${event}`),
    text:`Operational alert from mikenium-api\n\nEvent: ${event}\nTime: ${timestamp}\n\nDetails:\n${detailText}`,
    html:`<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.6"><h2 style="color:#c62828">Mikenium operational alert</h2><p><strong>Event:</strong> ${escapeHtml(event)}<br><strong>Time:</strong> ${escapeHtml(timestamp)}</p><pre style="white-space:pre-wrap">${escapeHtml(detailText)}</pre></div>`
  });
}

export async function sendContactNotification(message){
  const subject=`New website enquiry: ${message.subject}`;
  return getTransporter().sendMail({
    from:{name:headerText(message.senderBrand)||'Mikenium Website',address:user},
    to:message.notificationEmail||contactTo,
    replyTo:{name:headerText(message.senderName),address:message.senderEmail},
    subject:headerText(subject),
    text:[
      `New enquiry from ${message.senderName}`,
      `Email: ${message.senderEmail}`,
      `Company: ${message.company||'Not provided'}`,
      `Phone: ${message.phone||'Not provided'}`,
      `Service: ${message.service||'General enquiry'}`,
      '',
      message.message
    ].join('\n'),
    html:`<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.6"><h2 style="color:#0874e8">New website enquiry</h2><p><strong>From:</strong> ${escapeHtml(message.senderName)} &lt;${escapeHtml(message.senderEmail)}&gt;</p><p><strong>Company:</strong> ${escapeHtml(message.company||'Not provided')}<br><strong>Phone:</strong> ${escapeHtml(message.phone||'Not provided')}<br><strong>Service:</strong> ${escapeHtml(message.service||'General enquiry')}</p><hr style="border:0;border-top:1px solid #dce4ee"><p>${lines(message.message)}</p></div>`
  });
}

export async function sendContactReply({to,name,subject,body}){
  return getTransporter().sendMail({
    from:{name:'Mikenium',address:user},
    to,
    replyTo:user,
    subject:headerText(`Re: ${subject}`),
    text:`Hello ${name},\n\n${body}\n\nRegards,\nMikenium Team`,
    html:`<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.65"><p>Hello ${escapeHtml(name)},</p><p>${lines(body)}</p><p>Regards,<br><strong>Mikenium Team</strong></p></div>`
  });
}

export async function sendNewsletterConfirmation(email,confirmationUrl,unsubscribeUrl){
  return getTransporter().sendMail({
    from:{name:'Mikenium Insights',address:user},
    to:email,
    replyTo:user,
    subject:'Confirm your Mikenium Insights subscription',
    text:`Confirm your subscription by opening this link within one hour:\n\n${confirmationUrl}\n\nTo opt out, use this private link:\n${unsubscribeUrl}\n\nIf you did not request this, ignore this email.`,
    html:`<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.65"><h2 style="color:#0874e8">Confirm your subscription</h2><p>Open the secure link below within one hour to subscribe to Mikenium Insights.</p><p><a href="${escapeHtml(confirmationUrl)}">Confirm subscription</a></p><p>If you did not request this, you can safely ignore this email or <a href="${escapeHtml(unsubscribeUrl)}">opt out</a>.</p></div>`
  });
}
