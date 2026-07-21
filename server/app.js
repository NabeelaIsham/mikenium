import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {randomUUID} from 'crypto';
import {fileURLToPath} from 'url';
import path from 'path';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import publicProjectRoutes from './routes/public-projects.js';
import serviceRoutes from './routes/services.js';
import publicServiceRoutes from './routes/public-services.js';
import productRoutes from './routes/products.js';
import publicProductRoutes from './routes/public-products.js';
import pricingRoutes from './routes/pricing.js';
import publicPricingRoutes from './routes/public-pricing.js';
import blogRoutes from './routes/blogs.js';
import publicBlogRoutes from './routes/public-blogs.js';
import testimonialRoutes from './routes/testimonials.js';
import publicTestimonialRoutes from './routes/public-testimonials.js';
import publicContactRoutes from './routes/public-contact.js';
import contactMessageRoutes from './routes/contact-messages.js';
import newsletterRoutes from './routes/newsletter.js';
import partnerRoutes from './routes/partners.js';
import publicPartnerRoutes from './routes/public-partners.js';
import settingRoutes from './routes/settings.js';
import publicSettingRoutes from './routes/public-settings.js';
import activityLogRoutes from './routes/activity-logs.js';
import systemBackupRoutes from './routes/system-backups.js';
import {pool} from './config/db.js';
import {env} from './config/env.js';
import {rateLimit} from './middleware/rate-limit.js';

const app=express();
const uploadsPath=fileURLToPath(new URL('./uploads',import.meta.url));
const staticPath=env.staticDir?path.resolve(env.staticDir):'';
app.disable('x-powered-by');
app.set('trust proxy',env.isProduction?1:false);
app.use((req,res,next)=>{req.id=req.get('x-request-id')||randomUUID();res.set('X-Request-Id',req.id);next()});
app.use(helmet({
  crossOriginResourcePolicy:{policy:'same-site'},
  contentSecurityPolicy:{directives:{imgSrc:["'self'",'data:','https:'],upgradeInsecureRequests:env.isProduction?[]:null}}
}));
app.use(cors({
  credentials:true,
  origin(origin,callback){
    if(!origin||env.clientOrigins.includes(origin))return callback(null,true);
    callback(new Error('Origin is not allowed'));
  }
}));
app.use('/uploads',express.static(uploadsPath,{fallthrough:false,maxAge:env.isProduction?'7d':0,setHeaders:res=>res.setHeader('Cross-Origin-Resource-Policy','same-site')}));
app.use(express.json({limit:'1mb'}));

app.get('/api/health',(req,res)=>res.json({status:'ok'}));
app.get('/api/ready',async(req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ready',database:'ok'})}catch{res.status(503).json({status:'not-ready',database:'unavailable'})}});
app.use('/api/auth',authRoutes);
app.use('/api/settings',publicSettingRoutes);
app.use('/api/projects',publicProjectRoutes);
app.use('/api/services',publicServiceRoutes);
app.use('/api/products',publicProductRoutes);
app.use('/api/pricing',publicPricingRoutes);
app.use('/api/blogs',publicBlogRoutes);
app.use('/api/testimonials',publicTestimonialRoutes);
app.use('/api/partners',publicPartnerRoutes);
app.use('/api/contact',rateLimit({scope:'contact',limit:5,windowMs:15*60*1000}),publicContactRoutes);
app.use('/api/newsletter',rateLimit({scope:'newsletter',limit:5,windowMs:60*60*1000,key:req=>`${req.ip}:${req.body?.email||''}`}),newsletterRoutes);
app.use('/api/admin/settings',settingRoutes);
app.use('/api/admin/dashboard',dashboardRoutes);
app.use('/api/admin/users',userRoutes);
app.use('/api/admin/clients',clientRoutes);
app.use('/api/admin/projects',projectRoutes);
app.use('/api/admin/services',serviceRoutes);
app.use('/api/admin/products',productRoutes);
app.use('/api/admin/pricing',pricingRoutes);
app.use('/api/admin/blogs',blogRoutes);
app.use('/api/admin/testimonials',testimonialRoutes);
app.use('/api/admin/partners',partnerRoutes);
app.use('/api/admin/contact-messages',contactMessageRoutes);
app.use('/api/admin/activity-logs',activityLogRoutes);
app.use('/api/admin/system-backups',systemBackupRoutes);

app.use('/api',(req,res)=>res.status(404).json({message:'API endpoint not found'}));
if(staticPath){
  app.use(express.static(staticPath,{index:false,maxAge:env.isProduction?'1d':0}));
  app.use((req,res,next)=>{
    if(req.method!=='GET'||!req.accepts('html'))return next();
    res.set('Cache-Control','no-store');
    res.sendFile(path.join(staticPath,'index.html'));
  });
}
app.use((req,res)=>res.status(404).json({message:'Not found'}));
app.use((error,req,res,next)=>{
  const status=error.type==='entity.too.large'?413:error.message==='Origin is not allowed'?403:500;
  if(status===500)console.error(JSON.stringify({level:'error',requestId:req.id,message:error.message,stack:env.isProduction?undefined:error.stack}));
  res.status(status).json({message:status===413?'Upload or request body is too large':status===403?'Origin is not allowed':'Unexpected server error',requestId:req.id});
});

export default app;
