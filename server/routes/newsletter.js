import {Router} from 'express';
import {z} from 'zod';
import {pool} from '../config/db.js';
import {sendNewsletterWelcome} from '../services/mailer.js';

const router=Router();
const schema=z.object({
  email:z.string().trim().email('Enter a valid email address').max(255),
  source:z.string().trim().max(80).default('Homepage')
});

router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Enter a valid email address'});
  const email=parsed.data.email.toLowerCase();
  const existing=await pool.query('SELECT id,status FROM newsletter_subscribers WHERE email=$1',[email]);
  if(existing.rows[0]?.status==='ACTIVE')return res.json({message:'You are already subscribed.',alreadySubscribed:true});

  let subscriber;
  if(existing.rows[0]){
    const {rows}=await pool.query(`UPDATE newsletter_subscribers SET status='ACTIVE',source=$2,confirmation_status='PENDING',confirmation_error='',subscribed_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[existing.rows[0].id,parsed.data.source]);
    subscriber=rows[0];
  }else{
    try{
      const {rows}=await pool.query(`INSERT INTO newsletter_subscribers(email,source) VALUES($1,$2) RETURNING *`,[email,parsed.data.source]);
      subscriber=rows[0];
    }catch(error){
      if(error.code==='23505')return res.json({message:'You are already subscribed.',alreadySubscribed:true});
      throw error;
    }
  }

  let confirmationSent=false;
  try{
    await sendNewsletterWelcome(email);
    confirmationSent=true;
    await pool.query(`UPDATE newsletter_subscribers SET confirmation_status='SENT',confirmation_error='',updated_at=now() WHERE id=$1`,[subscriber.id]);
  }catch(error){
    console.error('Newsletter confirmation email failed:',error.message);
    await pool.query(`UPDATE newsletter_subscribers SET confirmation_status='FAILED',confirmation_error=$2,updated_at=now() WHERE id=$1`,[subscriber.id,error.message.slice(0,1000)]);
  }
  res.status(201).json({message:'Subscription confirmed. Welcome to Mikenium Insights!',confirmationSent});
});

export default router;
