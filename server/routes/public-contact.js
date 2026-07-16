import {Router} from 'express';
import {z} from 'zod';
import {pool} from '../config/db.js';
import {sendContactNotification} from '../services/mailer.js';

const router=Router();
const schema=z.object({
  name:z.string().trim().min(2).max(160),
  email:z.string().trim().email().max(255),
  company:z.string().trim().max(180).default(''),
  phone:z.string().trim().max(50).default(''),
  service:z.string().trim().min(2).max(140),
  message:z.string().trim().min(10).max(10000),
  website:z.string().max(0).optional()
});

router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Please check your enquiry details'});
  const data=parsed.data;
  const subject=data.service==='Something else'?'General website enquiry':`${data.service} enquiry`;
  const {rows}=await pool.query(
    `INSERT INTO contact_messages(sender_name,sender_email,company,phone,service,subject,message,channel,ip_address,user_agent)
     VALUES($1,lower($2),$3,$4,$5,$6,$7,'Contact Form',$8,$9) RETURNING *`,
    [data.name,data.email,data.company,data.phone,data.service,subject,data.message,req.ip,req.get('user-agent')||'']
  );
  const record=rows[0];
  let notificationSent=false;
  try{
    const settingsResult=await pool.query('SELECT general,email FROM site_settings WHERE id=1');
    const siteSettings=settingsResult.rows[0]||{};const emailSettings=siteSettings.email||{};
    if(emailSettings.notifyContact===false){
      await pool.query(`UPDATE contact_messages SET notification_status='SENT',notification_error='',updated_at=now() WHERE id=$1`,[record.id]);
    }else await sendContactNotification({
      senderName:record.sender_name,senderEmail:record.sender_email,company:record.company,
      phone:record.phone,service:record.service,subject:record.subject,message:record.message,
      notificationEmail:emailSettings.notificationEmail,senderBrand:emailSettings.senderName||siteSettings.general?.siteName
    });
    notificationSent=emailSettings.notifyContact!==false;
    await pool.query(`UPDATE contact_messages SET notification_status='SENT',notification_error='',updated_at=now() WHERE id=$1`,[record.id]);
  }catch(error){
    console.error('Contact notification email failed:',error.message);
    await pool.query(`UPDATE contact_messages SET notification_status='FAILED',notification_error=$2,updated_at=now() WHERE id=$1`,[record.id,error.message.slice(0,1000)]);
  }
  res.status(201).json({message:'Thank you. Your enquiry has been received.',id:record.id,notificationSent});
});

export default router;
