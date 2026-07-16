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
const assurances=[[I.ShieldCheck,'14-day free trial','Explore every feature, risk-free.'],[I.BadgeDollarSign,'No setup fees','Start without hidden costs.'],[I.RefreshCcw,'Cancel anytime','Plans that flex with your business.'],[I.LockKeyhole,'Secure & reliable','Enterprise-grade protection.']];
const faqs=[
  ['Can I change my plan later?','Absolutely. Upgrade or move to a different plan whenever your needs change. We’ll apply the change to your next billing cycle.'],
  ['Is there a free trial available?','Yes. Every standard plan includes a 14-day trial with no setup fee, so your team can evaluate the complete experience.'],
  ['What payment methods do you accept?','We accept major credit and debit cards. Enterprise engagements can also be invoiced by bank transfer.'],
  ['Do you offer refunds?','If the service is not the right fit, contact us during your first 14 days and our team will help with a refund.'],
  ['Can I cancel my subscription anytime?','Yes. There are no long-term lock-ins on monthly plans, and your access continues until the end of the paid period.'],
  ['Is my data secure?','Yes. We use encryption, access controls, routine backups, and secure engineering practices across every plan.']
];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src={companyContact.logoUrl} alt={companyContact.logoAlt}/></a>}
function SiteButton({children,href='/#contact'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}
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
          <div className="billing-switch" role="group" aria-label="Billing period"><span className={!annual?'selected':''}>Monthly</span><button onClick={()=>setAnnual(!annual)} aria-label={`Switch to ${annual?'monthly':'annual'} billing`} aria-pressed={annual}><i className={annual?'annual':''}/></button><span className={annual?'selected':''}>Yearly <b>Save 20%</b></span></div>
          <div className="pricing-currency-switch" role="group" aria-label="Display currency">{['LKR','USD','AUD'].map(code=><button className={currency===code?'active':''} onClick={()=>setCurrency(code)} key={code}>{code}</button>)}</div>
          <div className="pricing-trust"><span><I.CheckCircle2/> No credit card required</span><span><I.CheckCircle2/> Cancel anytime</span><span><I.CheckCircle2/> Human support</span></div>
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
