import nodemailer from 'nodemailer';

const host=process.env.SMTP_HOST||'mail.privateemail.com';
const port=Number(process.env.SMTP_PORT||465);
const secure=String(process.env.SMTP_SECURE??port===465).toLowerCase()==='true';
const user=process.env.SMTP_USER||process.env.SUPER_ADMIN_EMAIL;
const pass=process.env.SMTP_PASS;
const contactTo=process.env.CONTACT_TO_EMAIL||process.env.SUPER_ADMIN_EMAIL||user;

let transporter;
function getTransporter(){
  if(!user||!pass)throw new Error('SMTP credentials are not configured');
  transporter ||= nodemailer.createTransport({
    host,
    port,
    secure,
    auth:{user,pass},
    connectionTimeout:15000,
    greetingTimeout:15000,
    socketTimeout:20000
  });
  return transporter;
}

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const lines=value=>escapeHtml(value).replace(/\r?\n/g,'<br>');

export async function sendContactNotification(message){
  const subject=`New website enquiry: ${message.subject}`;
  return getTransporter().sendMail({
    from:`${message.senderBrand||'Mikenium Website'} <${user}>`,
    to:message.notificationEmail||contactTo,
    replyTo:`${message.senderName} <${message.senderEmail}>`,
    subject,
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
    from:`Mikenium <${user}>`,
    to,
    replyTo:user,
    subject:`Re: ${subject}`,
    text:`Hello ${name},\n\n${body}\n\nRegards,\nMikenium Team`,
    html:`<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.65"><p>Hello ${escapeHtml(name)},</p><p>${lines(body)}</p><p>Regards,<br><strong>Mikenium Team</strong></p></div>`
  });
}

export async function sendNewsletterWelcome(email){
  return getTransporter().sendMail({
    from:`Mikenium Insights <${user}>`,
    to:email,
    replyTo:user,
    subject:'Welcome to Mikenium Insights',
    text:'You are subscribed to Mikenium Insights. We will send practical updates about software, design, AI, and digital growth.',
    html:'<div style="font-family:Arial,sans-serif;color:#17233a;line-height:1.65"><h2 style="color:#0874e8">Welcome to Mikenium Insights</h2><p>Your subscription is confirmed.</p><p>We’ll share practical updates about software, design, AI, and digital growth.</p><p>Regards,<br><strong>Mikenium Team</strong></p></div>'
  });
}
