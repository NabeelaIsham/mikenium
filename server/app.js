import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {randomUUID} from 'crypto';
import {fileURLToPath} from 'url';
import path from 'path';
import {readFile} from 'fs/promises';
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
import {sendOperationalAlert} from './services/alerts.js';
import {requireTrustedBrowserOrigin} from './middleware/browser-origin.js';

const app=express();
const uploadsPath=fileURLToPath(new URL('./uploads',import.meta.url));
const staticPath=env.staticDir?path.resolve(env.staticDir):'';
app.disable('x-powered-by');
app.set('trust proxy',env.isProduction?1:false);
app.use((req,res,next)=>{const supplied=req.get('x-request-id')||'';req.id=/^[a-zA-Z0-9._-]{1,128}$/.test(supplied)?supplied:randomUUID();res.set('X-Request-Id',req.id);next()});
app.use((req,res,next)=>{const started=process.hrtime.bigint();res.on('finish',()=>console.log(JSON.stringify({level:'info',event:'HTTP_REQUEST',requestId:req.id,method:req.method,path:req.originalUrl.split('?')[0],status:res.statusCode,durationMs:Number(process.hrtime.bigint()-started)/1e6})));next()});
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

app.get('/api',(req,res)=>res.json({service:'mikenium-api',status:'ok',health:'/api/health',readiness:'/api/ready'}));
app.get('/api/health',(req,res)=>res.json({status:'ok'}));
app.get('/api/ready',async(req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ready',database:'ok'})}catch{res.status(503).json({status:'not-ready',database:'unavailable'})}});
const publicPaths=['/','/about','/services','/portfolio','/products','/pricing','/blog','/contact','/privacy-policy','/terms-of-service','/cookie-policy'];
const staticSeo={
  '/':['Software Development Company in Sri Lanka | Mikenium','Mikenium designs and develops secure web, mobile, cloud, and custom software for ambitious businesses in Sri Lanka and worldwide.'],
  '/about':['About Mikenium | Software Product Team in Sri Lanka','Meet Mikenium, a Sri Lankan software product team combining strategy, human-centered design, and dependable engineering.'],
  '/services':['Software Development Services in Sri Lanka | Mikenium','Explore custom software, web and mobile development, UI/UX design, cloud engineering, security, automation, and ongoing support.'],
  '/portfolio':['Software Development Portfolio & Case Studies | Mikenium','Explore digital products and custom software engineered by Mikenium for measurable business outcomes.'],
  '/products':['Business Software Products Built by Mikenium','Discover practical, scalable software products built by Mikenium to simplify operations and help modern teams grow.'],
  '/pricing':['Software Development Pricing & Plans | Mikenium','Compare transparent software development and support plans from Mikenium, with flexible options for growing businesses.'],
  '/blog':['Software, AI & Product Development Insights | Mikenium','Read practical insights from Mikenium on software engineering, AI, product strategy, design, security, and digital growth.'],
  '/contact':['Contact Mikenium | Start Your Software Project','Talk to Mikenium about your software, web, mobile, cloud, or digital product project. Our team responds within one business day.'],
  '/privacy-policy':['Privacy Policy | Mikenium','Learn how Mikenium collects, uses, protects, and retains personal information.'],
  '/terms-of-service':['Terms of Service | Mikenium','Read the terms governing use of the Mikenium website and services.'],
  '/cookie-policy':['Cookie Policy | Mikenium','Learn how Mikenium uses essential and optional cookies on this website.']
};
const requestOrigin=req=>`${req.protocol}://${req.get('host')}`;
const escapeAttribute=value=>String(value).replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
function injectSeo(html,{title,description,canonical,robots='index,follow'}){const safeTitle=escapeAttribute(title),safeDescription=escapeAttribute(description),safeCanonical=escapeAttribute(canonical);return html.replace(/<title>.*?<\/title>/,`<title>${safeTitle}</title>`).replace(/<meta name="description" content="[^"]*" \/>/,`<meta name="description" content="${safeDescription}" />`).replace(/<meta name="robots" content="[^"]*" \/>/,`<meta name="robots" content="${robots}" />`).replace(/<meta property="og:title" content="[^"]*" \/>/,`<meta property="og:title" content="${safeTitle}" />`).replace(/<meta property="og:description" content="[^"]*" \/>/,`<meta property="og:description" content="${safeDescription}" />`).replace('</head>',`<link rel="canonical" href="${safeCanonical}" /><meta property="og:url" content="${safeCanonical}" /></head>`)}
app.get('/robots.txt',async(req,res,next)=>{try{const {rows}=await pool.query('SELECT seo,maintenance FROM site_settings WHERE id=1');const indexing=rows[0]?.seo?.allowIndexing!==false&&!rows[0]?.maintenance?.enabled;res.type('text/plain').send(indexing?`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${requestOrigin(req)}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n')}catch(error){next(error)}});
app.get('/sitemap.xml',async(req,res,next)=>{try{
  const [{rows},{rows:settingsRows}]=await Promise.all([pool.query(`SELECT slug,COALESCE(updated_at,published_at,scheduled_at) AS modified FROM blog_posts WHERE status='PUBLISHED' OR (status='SCHEDULED' AND scheduled_at<=now()) ORDER BY modified DESC`),pool.query('SELECT seo,maintenance FROM site_settings WHERE id=1')]);
  const indexing=settingsRows[0]?.seo?.allowIndexing!==false&&!settingsRows[0]?.maintenance?.enabled;
  const origin=requestOrigin(req),escape=value=>String(value).replace(/[<>&'\"]/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[char]));
  const urls=indexing?[...publicPaths.map(path=>({path,modified:null})),...rows.map(row=>({path:`/blog/${encodeURIComponent(row.slug)}`,modified:row.modified}))]:[];
  const body=urls.map(item=>`  <url><loc>${escape(origin+item.path)}</loc>${item.modified?`<lastmod>${new Date(item.modified).toISOString()}</lastmod>`:''}</url>`).join('\n');
  res.type('application/xml').set('Cache-Control','public, max-age=3600').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
}catch(error){next(error)}});
app.use('/api/auth',authRoutes);
app.use('/api/settings',publicSettingRoutes);
app.use('/api/projects',publicProjectRoutes);
app.use('/api/services',publicServiceRoutes);
app.use('/api/products',publicProductRoutes);
app.use('/api/pricing',publicPricingRoutes);
app.use('/api/blogs',publicBlogRoutes);
app.use('/api/testimonials',publicTestimonialRoutes);
app.use('/api/partners',publicPartnerRoutes);
app.use('/api/contact',rateLimit({scope:'contact-ip',limit:5,windowMs:15*60*1000}),rateLimit({scope:'contact-email',limit:10,windowMs:24*60*60*1000,key:req=>String(req.body?.email||'').trim().toLowerCase()}),publicContactRoutes);
app.post('/api/newsletter',rateLimit({scope:'newsletter-ip',limit:20,windowMs:60*60*1000}),rateLimit({scope:'newsletter-email',limit:3,windowMs:60*60*1000,key:req=>String(req.body?.email||'').trim().toLowerCase()}));
app.use('/api/newsletter',newsletterRoutes);
app.use('/api/admin',(req,res,next)=>{res.set({'Cache-Control':'no-store','Pragma':'no-cache'});next()});
app.use('/api/admin',requireTrustedBrowserOrigin);
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
  app.use(express.static(staticPath,{index:false,maxAge:env.isProduction?'30d':0,setHeaders:(res,filePath)=>{if(env.isProduction&&/[\\/]assets[\\/].+-[A-Za-z0-9_-]{8,}\.(?:css|js)$/.test(filePath))res.setHeader('Cache-Control','public, max-age=31536000, immutable')}}));
  app.use(async(req,res,next)=>{
    if(req.method!=='GET'||!req.accepts('html'))return next();
    try{
      res.set('Cache-Control','no-store');
      const pathname=req.path.replace(/\/$/,'')||'/',isAdmin=pathname.startsWith('/admin'),isBlog=/^\/blog\/[^/]+$/.test(pathname);
      let metadata=staticSeo[pathname];
      if(isBlog){const slug=pathname.slice(6);const {rows}=await pool.query(`SELECT title,excerpt,seo_title,seo_description FROM blog_posts WHERE lower(slug)=lower($1) AND (status='PUBLISHED' OR (status='SCHEDULED' AND scheduled_at<=now()))`,[slug]);if(rows[0])metadata=[rows[0].seo_title||`${rows[0].title} | Mikenium`,rows[0].seo_description||rows[0].excerpt]}
      const known=Boolean(metadata)||isAdmin;
      const fallback=known?metadata||['Mikenium Administration','Mikenium private administration area.']:['Page Not Found | Mikenium','The requested page could not be found.'];
      const html=await readFile(path.join(staticPath,'index.html'),'utf8');
      res.status(known?200:404).send(injectSeo(html,{title:fallback[0],description:fallback[1],canonical:`${requestOrigin(req)}${pathname}`,robots:isAdmin||!known?'noindex,nofollow':'index,follow'}));
    }catch(error){next(error)}
  });
}
app.use((req,res)=>res.status(404).json({message:'Not found'}));
app.use((error,req,res,next)=>{
  const status=error.type==='entity.too.large'?413:error.message==='Origin is not allowed'?403:500;
  if(status===500){console.error(JSON.stringify({level:'error',requestId:req.id,message:error.message,stack:env.isProduction?undefined:error.stack}));void sendOperationalAlert('HTTP_500',{requestId:req.id,path:req.originalUrl.split('?')[0],message:error.message})}
  res.status(status).json({message:status===413?'Upload or request body is too large':status===403?'Origin is not allowed':'Unexpected server error',requestId:req.id});
});

export default app;
