import React,{lazy,Suspense} from 'react';
import CookieConsent from './components/CookieConsent';
import GoogleAnalytics from './components/GoogleAnalytics';
import Seo from './components/Seo';
import {SiteSettingsProvider} from './context/SiteSettingsContext';
import './styles/public-home.css';
import './styles/about-page.css';
import './styles/services-page.css';
import './styles/portfolio-page.css';
import './styles/products-page.css';
import './styles/pricing-page.css';
import './styles/blog-page.css';
import './styles/single-blog-page.css';
import './styles/contact-page.css';
import './styles/legal-pages.css';
import './styles/responsive-public.css';
import './styles/production-safety.css';

const AdminShell=lazy(()=>import('./AdminShell'));
const PublicHome=lazy(()=>import('./pages/website/PublicHome'));
const AboutPage=lazy(()=>import('./pages/website/AboutPage'));
const ServicesPage=lazy(()=>import('./pages/website/ServicesPage'));
const PortfolioPage=lazy(()=>import('./pages/website/PortfolioPage'));
const ProductsPage=lazy(()=>import('./pages/website/ProductsPage'));
const PricingPage=lazy(()=>import('./pages/website/PricingPage'));
const BlogPage=lazy(()=>import('./pages/website/BlogPage'));
const SingleBlogPage=lazy(()=>import('./pages/website/SingleBlogPage'));
const ContactPage=lazy(()=>import('./pages/website/ContactPage'));
const LegalPage=lazy(()=>import('./pages/website/LegalPage'));

const pageSeo={
  '/':{title:'Software Development Company in Sri Lanka | Mikenium',description:'Mikenium designs and develops secure web, mobile, cloud, and custom software for ambitious businesses in Sri Lanka and worldwide.',keywords:'software development company Sri Lanka, custom software development, web development Sri Lanka, mobile app development'},
  '/about':{title:'About Mikenium | Software Product Team in Sri Lanka',description:'Meet Mikenium, a Sri Lankan software product team combining strategy, human-centered design, and dependable engineering.'},
  '/services':{title:'Software Development Services in Sri Lanka | Mikenium',description:'Explore custom software, web and mobile development, UI/UX design, cloud engineering, security, automation, and ongoing support.'},
  '/portfolio':{title:'Software Development Portfolio & Case Studies | Mikenium',description:'Explore digital products and custom software engineered by Mikenium for measurable business outcomes.'},
  '/products':{title:'Business Software Products Built by Mikenium',description:'Discover practical, scalable software products built by Mikenium to simplify operations and help modern teams grow.'},
  '/pricing':{title:'Software Development Pricing & Plans | Mikenium',description:'Compare transparent software development and support plans from Mikenium, with flexible options for growing businesses.'},
  '/blog':{title:'Software, AI & Product Development Insights | Mikenium',description:'Read practical insights from Mikenium on software engineering, AI, product strategy, design, security, and digital growth.'},
  '/contact':{title:'Contact Mikenium | Start Your Software Project',description:'Talk to Mikenium about your software, web, mobile, cloud, or digital product project. Our team responds within one business day.'},
  '/privacy-policy':{title:'Privacy Policy | Mikenium',description:'Learn how Mikenium collects, uses, protects, and retains personal information.'},
  '/terms-of-service':{title:'Terms of Service | Mikenium',description:'Read the terms governing use of the Mikenium website and services.'},
  '/cookie-policy':{title:'Cookie Policy | Mikenium',description:'Learn how Mikenium uses essential and optional cookies on this website.'}
};
function Loading(){return <div role="status" aria-live="polite" style={{minHeight:'60vh',display:'grid',placeItems:'center'}}>Loading…</div>}
function NotFound(){return <main style={{minHeight:'70vh',display:'grid',placeItems:'center',textAlign:'center',padding:'3rem'}}><div><h1>Page not found</h1><p>The page you requested does not exist.</p><a href="/">Return to Mikenium</a></div></main>}
export default function App(){
  const path=window.location.pathname.replace(/\/$/,'')||'/';
  if(path.startsWith('/admin'))return <><Seo title="Mikenium Administration" description="Mikenium private administration area." path={path} robots="noindex, nofollow, noarchive"/><Suspense fallback={<Loading/>}><AdminShell/></Suspense></>;
  const isArticle=path.startsWith('/blog/');
  const page=path==='/privacy-policy'?<LegalPage type="privacy"/>:path==='/terms-of-service'?<LegalPage type="terms"/>:path==='/cookie-policy'?<LegalPage type="cookies"/>:isArticle?<SingleBlogPage/>:path==='/about'?<AboutPage/>:path==='/services'?<ServicesPage/>:path==='/portfolio'?<PortfolioPage/>:path==='/products'?<ProductsPage/>:path==='/pricing'?<PricingPage/>:path==='/blog'?<BlogPage/>:path==='/contact'?<ContactPage/>:path==='/'?<PublicHome/>:<NotFound/>;
  const seo=pageSeo[path];
  return <SiteSettingsProvider><>{seo&&<Seo {...seo} path={path}/>} {!seo&&!isArticle&&<Seo title="Page Not Found | Mikenium" description="The requested page could not be found." path={path} robots="noindex, follow"/>}<Suspense fallback={<Loading/>}>{page}</Suspense><GoogleAnalytics/><CookieConsent/></></SiteSettingsProvider>
}
