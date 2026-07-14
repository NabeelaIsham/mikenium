import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import './public-home.css';
import './pricing-page.css';

const navItems=[['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']];
const plans=[
  {name:'Starter',eyebrow:'LAUNCH',icon:I.Rocket,monthly:19,description:'A focused foundation for startups and smaller digital projects.',features:['1 active project','5 GB secure storage','Essential support','Community access','Regular product updates'],cta:'Get started'},
  {name:'Professional',eyebrow:'GROW',icon:I.Zap,monthly:49,description:'More capacity and collaboration for ambitious growing teams.',features:['10 active projects','50 GB secure storage','Priority support','Team collaboration','Advanced analytics','API access'],cta:'Get started'},
  {name:'Business',eyebrow:'SCALE',icon:I.ChartNoAxesCombined,monthly:99,description:'Advanced delivery, insight, and support for established businesses.',features:['Unlimited projects','200 GB secure storage','24/7 priority support','Team collaboration','Advanced analytics','API access','Custom integrations'],cta:'Choose Business',popular:true},
  {name:'Enterprise',eyebrow:'TRANSFORM',icon:I.ShieldCheck,custom:true,description:'Tailored software, security, and support for complex organizations.',features:['Unlimited projects & storage','Dedicated success team','Advanced security controls','Custom integrations','SLA guarantee','On-premise options'],cta:'Contact sales'}
];
const assurances=[[I.ShieldCheck,'14-day free trial','Explore every feature, risk-free.'],[I.BadgeDollarSign,'No setup fees','Start without hidden costs.'],[I.RefreshCcw,'Cancel anytime','Plans that flex with your business.'],[I.LockKeyhole,'Secure & reliable','Enterprise-grade protection.']];
const faqs=[
  ['Can I change my plan later?','Absolutely. Upgrade or move to a different plan whenever your needs change. We’ll apply the change to your next billing cycle.'],
  ['Is there a free trial available?','Yes. Every standard plan includes a 14-day trial with no setup fee, so your team can evaluate the complete experience.'],
  ['What payment methods do you accept?','We accept major credit and debit cards. Enterprise engagements can also be invoiced by bank transfer.'],
  ['Do you offer refunds?','If the service is not the right fit, contact us during your first 14 days and our team will help with a refund.'],
  ['Can I cancel my subscription anytime?','Yes. There are no long-term lock-ins on monthly plans, and your access continues until the end of the paid period.'],
  ['Is my data secure?','Yes. We use encryption, access controls, routine backups, and secure engineering practices across every plan.']
];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/></a>}
function SiteButton({children,href='/#contact'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}
function Header({menu,setMenu,scrolled}){return <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}><Logo/><div className="nav-center"><nav className={menu?'open':''}>{navItems.map(([label,href],index)=><a className={label==='Pricing'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>0{index+1}</span>{label}</a>)}</nav></div><div className="nav-actions"><a className="nav-contact" href="/contact"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div></header>}
function Footer(){return <footer id="contact"><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton>Start a Conversation</SiteButton><a href="mailto:hello@mikenium.com">hello@mikenium.com <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{[I.Facebook,I.Linkedin,I.Twitter,I.Github,I.Instagram].map((Icon,i)=><a href="/" aria-label="Social link" key={i}><Icon/></a>)}</span></div><div className="footer-links"><div><h4>Company</h4>{[['About Us','/about'],['Our Work','/portfolio'],['Careers','/#contact'],['Contact','/#contact']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div><div><h4>Expertise</h4>{['Web Development','Mobile Apps','Cloud Solutions','UI/UX Design'].map(x=><a href="/services#capabilities" key={x}>{x}</a>)}</div><div><h4>Resources</h4>{[['Insights','/#blog'],['Products','/products'],['Pricing','/pricing'],['Client Stories','/portfolio']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div></div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href="mailto:hello@mikenium.com">hello@mikenium.com</a><a href="tel:+94112345678">+94 11 234 5678</a><small>Colombo, Sri Lanka</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>}

export default function PricingPage(){
  const [menu,setMenu]=useState(false);
  const [annual,setAnnual]=useState(true);
  const [openFaq,setOpenFaq]=useState(0);
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>24);onScroll();window.addEventListener('scroll',onScroll,{passive:true});const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('is-visible')),{threshold:.1});document.querySelectorAll('.pricing-page .reveal').forEach(el=>observer.observe(el));return()=>{window.removeEventListener('scroll',onScroll);observer.disconnect()}},[]);
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
          <div className="pricing-trust"><span><I.CheckCircle2/> No credit card required</span><span><I.CheckCircle2/> Cancel anytime</span><span><I.CheckCircle2/> Human support</span></div>
        </div>
      </section>

      <section className="plans-section reveal" aria-label="Pricing plans">
        <div className="plan-grid">{plans.map((plan,index)=>{const Icon=plan.icon;const amount=annual?Math.round(plan.monthly*.8):plan.monthly;return <article className={'plan-card '+(plan.popular?'featured ':'')+(plan.custom?'enterprise':'')} key={plan.name}>
          {plan.popular&&<div className="popular-label"><I.Sparkles/> Most popular</div>}
          <div className="plan-top"><span className="plan-icon"><Icon/></span><span className="plan-index">0{index+1}</span></div>
          <small>{plan.eyebrow}</small><h2>{plan.name}</h2><p>{plan.description}</p>
          <div className="plan-price">{plan.custom?<><strong>Custom</strong><span>Built around your goals</span></>:<><sup>$</sup><strong>{amount}</strong><span>/ month<br/><em>{annual?'billed annually':'billed monthly'}</em></span></>}</div>
          <a className="plan-button" href={plan.custom?'mailto:hello@mikenium.com':'/#contact'}>{plan.cta}<I.ArrowUpRight/></a>
          <div className="plan-divider"><span>Everything you need</span></div>
          <ul>{plan.features.map(feature=><li key={feature}><I.Check/>{feature}</li>)}</ul><i className="plan-beam"/>
        </article>})}</div>
        <p className="billing-footnote"><I.Info/> Prices shown in USD. Annual plans are billed once per year and include a 20% saving.</p>
      </section>

      <section className="assurance-strip reveal">{assurances.map(([Icon,title,text],i)=><article key={title}><span><Icon/></span><div><small>0{i+1}</small><h3>{title}</h3><p>{text}</p></div></article>)}</section>

      <section className="pricing-fit reveal">
        <div><span className="pricing-section-kicker">BUILT TO FIT</span><h2>More than a subscription.<br/><em>A product partner.</em></h2></div>
        <p>Every plan brings thoughtful engineering, transparent delivery, and room to grow. Need something unusual? We’re at our best when the problem doesn’t fit neatly in a box.</p>
        <a href="mailto:hello@mikenium.com">Talk through your needs <I.ArrowUpRight/></a>
      </section>

      <section className="faq-section reveal">
        <div className="faq-intro"><span className="pricing-section-kicker">QUESTIONS, ANSWERED</span><h2>Clarity before<br/>you commit.</h2><p>Everything you need to choose with confidence. Still curious? Our team is one email away.</p><a href="mailto:hello@mikenium.com">Ask us anything <I.MessageCircle/></a></div>
        <div className="faq-list">{faqs.map(([question,answer],i)=>{const open=openFaq===i;return <article className={open?'open':''} key={question}><button onClick={()=>setOpenFaq(open?null:i)} aria-expanded={open}><span>0{i+1}</span><b>{question}</b><i>{open?<I.Minus/>:<I.Plus/>}</i></button><div className="faq-answer"><p>{answer}</p></div></article>})}</div>
      </section>
    </main>
    <Footer/>
  </div>
}
