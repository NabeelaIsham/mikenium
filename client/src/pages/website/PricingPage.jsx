import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import '../../styles/public-home.css';
import '../../styles/pricing-page.css';
import {companyContact,footerNavigation} from '../../config/site-contact';
import { getPublicPricing } from '../../services/public-api';

const navItems=[['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']];
const pricingIcons={rocket:I.Rocket,zap:I.Zap,chart:I.ChartNoAxesCombined,shield:I.ShieldCheck,building:I.Building2,gem:I.Gem,star:I.Star,briefcase:I.BriefcaseBusiness};
const currencyLabel=currency=>({USD:'$',LKR:'Rs.',AUD:'A$'})[currency]||currency;
const formatPrice=(value,currency)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:currency==='LKR'?0:2}).format(value);
const assurances=[[I.ShieldCheck,'Clear scope','Know what is included before work begins.'],[I.BadgeDollarSign,'Transparent pricing','Review costs before committing.'],[I.RefreshCcw,'Flexible options','Choose the approach that fits your needs.'],[I.LockKeyhole,'Security minded','Risk is considered throughout delivery.']];
const faqs=[
  ['What services does Mikenium provide?','Mikenium offers custom software development, website development, mobile application development, UI/UX design, cloud solutions, SEO services, and ongoing maintenance and support. We build scalable digital solutions tailored to your business goals.'],
  ['How long does it take to complete a project?',"The timeline depends on the project's size and complexity. A business website typically takes 2–4 weeks, while custom software solutions may take 2–6 months. We provide a detailed project timeline after reviewing your requirements."],
  ['How much does a software project cost?','Every project is unique, so pricing depends on your requirements, features, and timeline. After an initial consultation, we provide a transparent, customized quotation with no hidden costs.'],
  ['Do you provide support after the project is completed?','Yes. We offer ongoing maintenance and support, including security updates, bug fixes, performance optimization, backups, and feature enhancements to keep your solution running smoothly.'],
  ['Can you build custom software for my business?',"Absolutely. We specialize in developing custom web applications, enterprise software, SaaS platforms, mobile apps, and business automation systems designed specifically for your organization's needs."],
  ['How do I get started with Mikenium?',"Simply contact us through our website, email, or phone. We'll schedule a free consultation to understand your goals, discuss the best solution for your business, and provide a detailed proposal and quotation."]
];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src={companyContact.logoUrl} alt={companyContact.logoAlt}/></a>}
function SiteButton({children,href='/contact#contact-form'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}
function Header({menu,setMenu,scrolled}){return <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}><Logo/><div className="nav-center"><nav className={menu?'open':''}>{navItems.map(([label,href],index)=><a className={label==='Pricing'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>0{index+1}</span>{label}</a>)}</nav></div><div className="nav-actions"><a className="nav-contact" href="/contact"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div></header>}
function Footer(){return <footer id="contact"><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton>Start a Conversation</SiteButton><a href={companyContact.emailHref}>{companyContact.email} <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{companyContact.socialLinks.map(item=>{const Icon=item.Icon;return <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label} key={item.label}><Icon/></a>})}</span></div><div className="footer-links">{footerNavigation.map(section=><div key={section.title}><h4>{section.title}</h4>{section.links.map(link=><a href={link.href} key={link.label}>{link.label}</a>)}</div>)}</div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href={companyContact.emailHref}>{companyContact.email}</a>{companyContact.phones.map(phone=><a href={phone.href} key={phone.href}>{phone.label}</a>)}<small>{companyContact.address}</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>}

export default function PricingPage(){
  const [menu,setMenu]=useState(false);
  const [annual,setAnnual]=useState(true);
  const [openFaq,setOpenFaq]=useState(0);
  const [scrolled,setScrolled]=useState(false);
  const [plans,setPlans]=useState([]);
  const [plansLoading,setPlansLoading]=useState(true);
  const [currency,setCurrency]=useState('LKR');
  useEffect(()=>{let mounted=true;getPublicPricing().then(items=>{if(mounted)setPlans(items)}).catch(()=>{}).finally(()=>mounted&&setPlansLoading(false));return()=>{mounted=false}},[]);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>24);onScroll();window.addEventListener('scroll',onScroll,{passive:true});const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('is-visible')),{threshold:.1});document.querySelectorAll('.pricing-page .reveal').forEach(el=>observer.observe(el));return()=>{window.removeEventListener('scroll',onScroll);observer.disconnect()}},[plans.length]);
  return <div className="public-site pricing-page">
    <Header menu={menu} setMenu={setMenu} scrolled={scrolled}/>
    <main>
      <section className="pricing-hero">
        <div className="pricing-grid-bg"/><div className="pricing-orb orb-one"/><div className="pricing-orb orb-two"/>
        <div className="pricing-rings"><i/><i/><i/></div>
        <div className="pricing-hero-copy">
          <span className="pricing-kicker"><i/> SIMPLE PRICING · SERIOUS CAPABILITY</span>
          <h1>Pick the runway.<br/><span>We’ll help you scale.</span></h1>
          <p>Clear plans for every stage of growth. Start lean, move faster, and expand without rebuilding the foundations.</p>
          <div className="billing-switch" role="group" aria-label="Billing period"><span className={!annual?'selected':''}>Monthly</span><button onClick={()=>setAnnual(!annual)} aria-label={`Switch to ${annual?'monthly':'annual'} billing`} aria-pressed={annual}><i className={annual?'annual':''}/></button><span className={annual?'selected':''}>Yearly</span></div>
          <div className="pricing-currency-switch" role="group" aria-label="Display currency">{['LKR','USD','AUD'].map(code=><button className={currency===code?'active':''} onClick={()=>setCurrency(code)} key={code}>{code}</button>)}</div>
          <div className="pricing-trust"><span><I.CheckCircle2/> Clear plan details</span><span><I.CheckCircle2/> Flexible options</span><span><I.CheckCircle2/> Human support</span></div>
        </div>
      </section>

      <section className="plans-section reveal" aria-label="Pricing plans">
        {plansLoading?<div className="pricing-data-state">Loading pricing plans...</div>:plans.length?<div className="plan-grid">{plans.map((plan,index)=>{const Icon=pricingIcons[plan.icon]||I.Rocket;const amount=plan.prices?.[currency]?.[annual?'annual':'monthly'];return <article className={'plan-card '+(plan.popular?'featured ':'')+(plan.custom?'enterprise':'')} key={plan.id}>
          {plan.popular&&<div className="popular-label"><I.Sparkles/> Most popular</div>}
          <div className="plan-top"><span className="plan-icon"><Icon/></span><span className="plan-index">0{index+1}</span></div>
          <small>{plan.eyebrow}</small><h2>{plan.name}</h2><p>{plan.description}</p>
          <div className="plan-price">{plan.custom?<><strong>Custom</strong><span>Built around your goals</span></>:<><sup>{currencyLabel(currency)}</sup><strong>{formatPrice(amount,currency)}</strong><span>{plan.billingSuffix}<br/><em>{currency} {annual?'annual':'monthly'} pricing</em></span></>}</div>
          <a className="plan-button" href={plan.ctaUrl}>{plan.ctaLabel}<I.ArrowUpRight/></a>
          <div className="plan-divider"><span>Everything you need</span></div>
          <ul>{plan.features.map(feature=><li key={feature}><I.Check/>{feature}</li>)}</ul><i className="plan-beam"/>
        </article>})}</div>:<div className="pricing-data-state">Pricing plans will be available soon.</div>}
        <p className="billing-footnote"><I.Info/> Pricing is managed and published through the Mikenium Super Admin.</p>
      </section>

      <section className="assurance-strip reveal">{assurances.map(([Icon,title,text],i)=><article key={title}><span><Icon/></span><div><small>0{i+1}</small><h3>{title}</h3><p>{text}</p></div></article>)}</section>

      <section className="pricing-fit reveal">
        <div><span className="pricing-section-kicker">BUILT TO FIT</span><h2>More than a subscription.<br/><em>A product partner.</em></h2></div>
        <p>Every plan brings thoughtful engineering, transparent delivery, and room to grow. Need something unusual? We’re at our best when the problem doesn’t fit neatly in a box.</p>
        <a href={companyContact.emailHref}>Talk through your needs <I.ArrowUpRight/></a>
      </section>

      <section className="faq-section reveal">
        <div className="faq-intro"><span className="pricing-section-kicker">QUESTIONS, ANSWERED</span><h2>Clarity before<br/>you commit.</h2><p>Everything you need to choose with confidence. Still curious? Our team is one email away.</p><a href={companyContact.emailHref}>Ask us anything <I.MessageCircle/></a></div>
        <div className="faq-list">{faqs.map(([question,answer],i)=>{const open=openFaq===i;return <article className={open?'open':''} key={question}><button onClick={()=>setOpenFaq(open?null:i)} aria-expanded={open}><span>0{i+1}</span><b>{question}</b><i>{open?<I.Minus/>:<I.Plus/>}</i></button><div className="faq-answer"><p>{answer}</p></div></article>})}</div>
      </section>
    </main>
    <Footer/>
  </div>
}
