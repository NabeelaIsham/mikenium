import express,{Router} from 'express';
import {z} from 'zod';
import {createHash,randomBytes} from 'crypto';
import {pool} from '../config/db.js';
import {sendNewsletterConfirmation} from '../services/mailer.js';
import {env} from '../config/env.js';

const router=Router();
const schema=z.object({
  email:z.string().trim().email('Enter a valid email address').max(255),
  source:z.string().trim().max(80).default('Homepage')
});
const hash=value=>createHash('sha256').update(value).digest('hex');

router.post('/',async(req,res)=>{
  const parsed=schema.safeParse(req.body);
  if(!parsed.success)return res.status(400).json({message:parsed.error.issues[0]?.message||'Enter a valid email address'});
  const email=parsed.data.email.toLowerCase();
  const existing=await pool.query('SELECT id,status FROM newsletter_subscribers WHERE email=$1',[email]);
  const genericResponse={message:'If this address can be subscribed, a confirmation email will arrive shortly.'};
  if(existing.rows[0]?.status==='ACTIVE')return res.status(202).json(genericResponse);

  const token=randomBytes(32).toString('hex');
  const unsubscribeToken=randomBytes(32).toString('hex');
  const tokenHash=hash(token),unsubscribeTokenHash=hash(unsubscribeToken);
  let subscriber;
  if(existing.rows[0]){
    const {rows}=await pool.query(`UPDATE newsletter_subscribers SET status='PENDING',source=$2,confirmation_status='PENDING',confirmation_error='',confirmation_token_hash=$3,confirmation_expires_at=now()+interval '1 hour',unsubscribe_token_hash=$4,unsubscribed_at=NULL,subscribed_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[existing.rows[0].id,parsed.data.source,tokenHash,unsubscribeTokenHash]);
    subscriber=rows[0];
  }else{
    try{
      const {rows}=await pool.query(`INSERT INTO newsletter_subscribers(email,source,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash) VALUES($1,$2,'PENDING',$3,now()+interval '1 hour',$4) RETURNING *`,[email,parsed.data.source,tokenHash,unsubscribeTokenHash]);
      subscriber=rows[0];
    }catch(error){
      if(error.code==='23505')return res.status(202).json(genericResponse);
      throw error;
    }
  }

  try{
    const baseUrl=env.isProduction?env.clientOrigins[0]:'http://localhost:5000';
    await sendNewsletterConfirmation(email,`${baseUrl}/api/newsletter/confirm?token=${token}`,`${baseUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`);
    await pool.query(`UPDATE newsletter_subscribers SET confirmation_status='SENT',confirmation_error='',updated_at=now() WHERE id=$1`,[subscriber.id]);
  }catch(error){
    console.error('Newsletter confirmation email failed:',error.message);
    await pool.query(`UPDATE newsletter_subscribers SET confirmation_status='FAILED',confirmation_error=$2,updated_at=now() WHERE id=$1`,[subscriber.id,error.message.slice(0,1000)]);
  }
  res.status(202).json(genericResponse);
});

router.get('/unsubscribe',async(req,res)=>{
  res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  const parsed=z.string().regex(/^[a-f0-9]{64}$/).safeParse(req.query.token);
  if(!parsed.success)return res.status(400).type('text').send('Invalid unsubscribe link.');
  res.type('html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><title>Unsubscribe</title><body><main><h1>Unsubscribe from Mikenium Insights?</h1><form method="post" action="/api/newsletter/unsubscribe"><input type="hidden" name="token" value="${parsed.data}"><button type="submit">Confirm unsubscribe</button></form></main></body></html>`);
});

router.post('/unsubscribe',express.urlencoded({extended:false,limit:'2kb'}),async(req,res)=>{
  res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  const parsed=z.string().regex(/^[a-f0-9]{64}$/).safeParse(req.body?.token);
  if(!parsed.success)return res.status(400).type('text').send('Invalid unsubscribe request.');
  const {rows}=await pool.query(`UPDATE newsletter_subscribers SET status='UNSUBSCRIBED',unsubscribed_at=now(),confirmation_token_hash=NULL,confirmation_expires_at=NULL,updated_at=now() WHERE unsubscribe_token_hash=$1 RETURNING id`,[hash(parsed.data)]);
  if(!rows[0])return res.status(400).type('text').send('This unsubscribe link is invalid.');
  res.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><title>Unsubscribed</title><body><main><h1>Unsubscribed</h1><p>This address will no longer receive Mikenium Insights.</p><a href="/">Return to Mikenium</a></main></body></html>');
});

router.get('/confirm',async(req,res)=>{
  res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  const parsed=z.string().regex(/^[a-f0-9]{64}$/).safeParse(req.query.token);
  if(!parsed.success)return res.status(400).type('text').send('Invalid confirmation link.');
  const {rows}=await pool.query(`UPDATE newsletter_subscribers SET status='ACTIVE',confirmed_at=now(),confirmation_token_hash=NULL,confirmation_expires_at=NULL,updated_at=now() WHERE confirmation_token_hash=$1 AND confirmation_expires_at>now() RETURNING id`,[hash(parsed.data)]);
  if(!rows[0])return res.status(400).type('text').send('This confirmation link is invalid or has expired.');
  res.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><title>Subscription confirmed</title><body><main><h1>Subscription confirmed</h1><p>You are now subscribed to Mikenium Insights.</p><a href="/">Return to Mikenium</a></main></body></html>');
});

export default router;
