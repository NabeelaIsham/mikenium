import {Router} from 'express';
import {z} from 'zod';
import {pool} from '../config/db.js';
import {requireSuperAdmin} from '../middleware/auth.js';
import {sendContactReply} from '../services/mailer.js';

const router=Router();
router.use(requireSuperAdmin);
router.param('id',(req,res,next,id)=>z.string().uuid().safeParse(id).success?next():res.status(400).json({message:'Invalid contact message ID'}));

const statuses=['NEW','READ','REPLIED','CLOSED','TRASH'];
const serializeReply=row=>({id:row.id,type:row.reply_type,body:row.body,recipientEmail:row.recipient_email||'',emailStatus:row.email_status,emailError:row.email_error||'',createdAt:row.created_at,createdBy:row.created_by_name||'Super Admin'});
const serialize=row=>({
  id:row.id,sender:row.sender_name,email:row.sender_email,company:row.company||'',phone:row.phone||'',
  service:row.service||'',subject:row.subject,message:row.message,status:row.status,channel:row.channel||'Contact Form',
  ip:row.ip_address||'',userAgent:row.user_agent||'',notificationStatus:row.notification_status,
  notificationError:row.notification_error||'',createdAt:row.created_at,updatedAt:row.updated_at,
  replies:Array.isArray(row.replies)?row.replies.map(serializeReply):[]
});
const audit=(userId,action,ip,metadata)=>pool.query('INSERT INTO admin_audit_logs(user_id,action,ip_address,metadata) VALUES($1,$2,$3,$4)',[userId,action,ip,JSON.stringify(metadata)]);

router.get('/',async(req,res)=>{
  const querySchema=z.object({q:z.string().trim().max(160).optional(),status:z.enum(statuses).optional(),channel:z.string().trim().max(60).optional()});
  const parsed=querySchema.safeParse(req.query);if(!parsed.success)return res.status(400).json({message:'Invalid message filters'});
  const values=[],where=[];
  if(parsed.data.q){values.push(`%${parsed.data.q}%`);where.push(`(sender_name ILIKE $${values.length} OR sender_email ILIKE $${values.length} OR subject ILIKE $${values.length} OR message ILIKE $${values.length} OR company ILIKE $${values.length})`)}
  if(parsed.data.status){values.push(parsed.data.status);where.push(`status=$${values.length}`)}
  if(parsed.data.channel){values.push(parsed.data.channel);where.push(`channel=$${values.length}`)}
  const condition=where.length?`WHERE ${where.join(' AND ')}`:'';
  const [records,stats,channels]=await Promise.all([
    pool.query(`SELECT * FROM contact_messages ${condition} ORDER BY created_at DESC LIMIT 500`,values),
    pool.query(`SELECT count(*)::int total,count(*) FILTER(WHERE status='NEW')::int new,count(*) FILTER(WHERE status='READ')::int read,count(*) FILTER(WHERE status='REPLIED')::int replied,count(*) FILTER(WHERE status='CLOSED')::int closed,count(*) FILTER(WHERE status='TRASH')::int trash FROM contact_messages`),
    pool.query(`SELECT DISTINCT channel FROM contact_messages ORDER BY channel`)
  ]);
  res.set('Cache-Control','no-store').json({messages:records.rows.map(serialize),stats:stats.rows[0],channels:channels.rows.map(row=>row.channel)});
});

router.get('/:id',async(req,res)=>{
  const [messageResult,repliesResult]=await Promise.all([
    pool.query('SELECT * FROM contact_messages WHERE id=$1',[req.params.id]),
    pool.query(`SELECT r.*,u.name created_by_name FROM contact_message_replies r LEFT JOIN users u ON u.id=r.created_by WHERE r.message_id=$1 ORDER BY r.created_at`,[req.params.id])
  ]);
  if(!messageResult.rows[0])return res.status(404).json({message:'Contact message not found'});
  res.set('Cache-Control','no-store').json({message:serialize({...messageResult.rows[0],replies:repliesResult.rows})});
});

router.patch('/:id',async(req,res)=>{
  const parsed=z.object({status:z.enum(statuses)}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:'Select a valid message status'});
  const {rows}=await pool.query('UPDATE contact_messages SET status=$1,updated_at=now() WHERE id=$2 RETURNING *',[parsed.data.status,req.params.id]);
  if(!rows[0])return res.status(404).json({message:'Contact message not found'});
  await audit(req.user.sub,'CONTACT_MESSAGE_UPDATED',req.ip,{targetMessageId:req.params.id,description:`Marked contact message as ${parsed.data.status.toLowerCase()}`});
  res.json({message:serialize(rows[0])});
});

router.post('/:id/replies',async(req,res)=>{
  const parsed=z.object({body:z.string().trim().min(2).max(10000),type:z.enum(['REPLY','INTERNAL_NOTE']).default('REPLY')}).safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Write a reply first'});
  const {rows}=await pool.query('SELECT * FROM contact_messages WHERE id=$1',[req.params.id]);
  const message=rows[0];if(!message)return res.status(404).json({message:'Contact message not found'});
  const isReply=parsed.data.type==='REPLY';
  const replyResult=await pool.query(
    `INSERT INTO contact_message_replies(message_id,created_by,reply_type,body,recipient_email,email_status)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [message.id,req.user.sub,parsed.data.type,parsed.data.body,isReply?message.sender_email:null,isReply?'PENDING':'NOT_REQUIRED']
  );
  const reply=replyResult.rows[0];
  if(isReply){
    try{
      await sendContactReply({to:message.sender_email,name:message.sender_name,subject:message.subject,body:parsed.data.body});
      await pool.query(`UPDATE contact_message_replies SET email_status='SENT',email_error='' WHERE id=$1`,[reply.id]);
      await pool.query(`UPDATE contact_messages SET status='REPLIED',updated_at=now() WHERE id=$1`,[message.id]);
    }catch(error){
      console.error('Contact reply email failed:',error.message);
      await pool.query(`UPDATE contact_message_replies SET email_status='FAILED',email_error=$2 WHERE id=$1`,[reply.id,error.message.slice(0,1000)]);
      return res.status(502).json({message:'The reply was saved, but the email could not be delivered. Check the SMTP configuration.'});
    }
  }
  await audit(req.user.sub,isReply?'CONTACT_REPLY_SENT':'CONTACT_NOTE_ADDED',req.ip,{targetMessageId:message.id,description:isReply?`Replied to ${message.sender_email}`:'Added an internal contact note'});
  res.status(201).json({reply:serializeReply({...reply,email_status:isReply?'SENT':'NOT_REQUIRED',created_by_name:'Super Admin'})});
});

export default router;
