import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import './public-home.css';
import './services-page.css';

const navItems=[['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']];
const services=[
  {icon:I.MonitorSmartphone,title:'Web Engineering',tag:'DIGITAL EXPERIENCES',text:'Fast, accessible web platforms designed around your customers and engineered for growth.',items:['Web applications','Enterprise portals','API integrations'],tone:'blue'},
  {icon:I.Smartphone,title:'Mobile Products',tag:'iOS · ANDROID',text:'High-quality native and cross-platform apps that feel effortless on every device.',items:['Product strategy','Cross-platform apps','App modernization'],tone:'cyan'},
  {icon:I.PenTool,title:'Product Design',tag:'UI · UX · RESEARCH',text:'Research-led product experiences that reduce friction, earn trust, and make complex work simple.',items:['UX research','Design systems','Rapid prototypes'],tone:'violet'},
  {icon:I.CloudCog,title:'Cloud & DevOps',tag:'SCALE WITH CONFIDENCE',text:'Resilient cloud architecture and automated delivery systems built for security, speed, and scale.',items:['Cloud migration','CI/CD automation','Infrastructure as code'],tone:'sky'},
  {icon:I.Blocks,title:'Custom Software',tag:'BUILT AROUND YOU',text:'Purpose-built business platforms that connect workflows, data, teams, and customer experiences.',items:['SaaS platforms','Workflow automation','Legacy modernization'],tone:'indigo'},
  {icon:I.ShieldCheck,title:'Quality & Support',tag:'RELIABLE BY DESIGN',text:'Continuous testing, monitoring, and hands-on support that keeps critical software performing.',items:['Quality engineering','Performance testing','24/7 maintenance'],tone:'teal'}
];
const models=[
  {icon:I.Rocket,title:'Launch a new product',label:'FROM ZERO TO ONE',text:'Shape the opportunity, validate the experience, and ship a focused first release.',points:['Discovery sprint','Product design','MVP engineering']},
  {icon:I.RefreshCw,title:'Modernize a platform',label:'MOVE FORWARD SAFELY',text:'Replace risk and technical debt with a secure, scalable foundation—without losing momentum.',points:['Architecture audit','Incremental rebuild','Cloud enablement']},
  {icon:I.UsersRound,title:'Extend your team',label:'EXPERTS ON DEMAND',text:'Add a focused product squad that works inside your rhythm and owns the outcome with you.',points:['Senior specialists','Flexible capacity','Shared delivery goals']}
];
const process=[
  [I.ScanSearch,'Discover','We align on users, business goals, constraints, and the clearest measure of success.'],
  [I.Map,'Define','We shape the roadmap, architecture, and experience before complexity gets expensive.'],
  [I.Code2,'Create','A senior team designs and builds in visible, testable iterations.'],
  [I.TestTube2,'Validate','We test quality, security, performance, and usability throughout delivery.'],
  [I.Rocket,'Evolve','We launch, measure, support, and keep improving what creates value.']
];
const stack=['React','Node.js','TypeScript','AWS','Azure','Flutter','PostgreSQL','Docker'];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/></a>}
function SiteButton({children,href='/#contact',ghost=false}){return <a className={'site-button '+(ghost?'outline':'')} href={href}>{children}<I.ArrowRight/></a>}
function Footer(){return <footer id="contact"><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton>Start a Conversation</SiteButton><a href="mailto:hello@mikenium.com">hello@mikenium.com <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{[I.Facebook,I.Linkedin,I.Twitter,I.Github,I.Instagram].map((Icon,i)=><a href="/" aria-label="Social link" key={i}><Icon/></a>)}</span></div><div className="footer-links"><div><h4>Company</h4>{[['About Us','/about'],['Our Work','/#portfolio'],['Careers','/#contact'],['Contact','/#contact']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div><div><h4>Expertise</h4>{['Web Development','Mobile Apps','Cloud Solutions','UI/UX Design'].map(x=><a href="/services#capabilities" key={x}>{x}</a>)}</div><div><h4>Resources</h4>{['Insights','Products','Pricing','Client Stories'].map(x=><a href="/#blog" key={x}>{x}</a>)}</div></div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href="mailto:hello@mikenium.com">hello@mikenium.com</a><a href="tel:+94112345678">+94 11 234 5678</a><small>Colombo, Sri Lanka</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>}

export default function ServicesPage(){
  const [menu,setMenu]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [activeModel,setActiveModel]=useState(0);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>24);onScroll();window.addEventListener('scroll',onScroll,{passive:true});const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('is-visible')),{threshold:.1});document.querySelectorAll('.services-page .reveal').forEach(el=>observer.observe(el));return()=>{window.removeEventListener('scroll',onScroll);observer.disconnect()}},[]);
  const ActiveIcon=models[activeModel].icon;
  return <div className="public-site services-page">
    <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}><Logo/><div className="nav-center"><nav className={menu?'open':''}>{navItems.map(([label,href],index)=><a className={label==='Services'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>0{index+1}</span>{label}</a>)}</nav></div><div className="nav-actions"><a className="nav-contact" href="/contact"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div></header>

    <main>
      <section className="services-hero">
        <div className="services-grid"/><div className="services-orb orb-a"/><div className="services-orb orb-b"/>
        <div className="services-hero-copy">
          <span className="services-kicker"><i/> OUR SERVICES <b>01 — 06</b></span>
          <h1>Digital systems<br/>built to create<br/><span>real momentum.</span></h1>
          <p>From first sketch to long-term scale, we combine strategy, design, and engineering to build software that performs in the real world.</p>
          <div className="services-actions"><SiteButton href="#capabilities">Explore capabilities</SiteButton><SiteButton ghost href="/#contact">Talk to an expert</SiteButton></div>
          <div className="hero-assurances"><span><I.CheckCircle2/> Senior specialists</span><span><I.CheckCircle2/> Clear weekly progress</span><span><I.CheckCircle2/> Security built in</span></div>
        </div>
        <div className="services-console" aria-label="Animated service delivery system">
          <div className="console-top"><span><i/><i/><i/></span><b>MIKENIUM / DELIVERY SYSTEM</b><small><i/> LIVE</small></div>
          <div className="console-core"><div className="core-rings"><i/><i/><i/></div><span className="core-icon"><I.Braces/></span><strong>BUILD<span> / </span>SHIP<span> / </span>SCALE</strong><small>ONE CONNECTED PRODUCT TEAM</small></div>
          <div className="console-nodes"><span className="node n1"><I.PenTool/><b>Design</b><small>Human-first</small></span><span className="node n2"><I.Code2/><b>Engineering</b><small>Built to last</small></span><span className="node n3"><I.CloudCog/><b>Cloud</b><small>Ready to scale</small></span></div>
          <div className="console-status"><span><i/> Product strategy</span><span><i/> Quality engineering</span><span><i/> Continuous support</span></div>
        </div>
      </section>

      <section className="services-proof" aria-label="Service outcomes">{[[I.BriefcaseBusiness,'100+','products delivered'],[I.Gauge,'2.4×','faster release cycles'],[I.HeartHandshake,'98%','client satisfaction'],[I.Headphones,'24/7','support coverage']].map(([Icon,n,l])=><article key={l}><Icon/><div><strong>{n}</strong><small>{l}</small></div></article>)}</section>

      <section className="capabilities reveal" id="capabilities">
        <div className="services-section-head"><div><span>WHAT WE DO</span><h2>Expertise for every stage<br/>of your <em>digital journey.</em></h2></div><p>Focused capabilities, connected by one delivery team. Choose a single service or bring us the entire product challenge.</p></div>
        <div className="capability-grid">{services.map(({icon:Icon,title,tag,text,items,tone},i)=><article className={'capability-card '+tone} key={title}><div className="capability-top"><span className="capability-icon"><Icon/></span><small>0{i+1}</small></div><span className="capability-tag">{tag}</span><h3>{title}</h3><p>{text}</p><ul>{items.map(item=><li key={item}><I.Check/>{item}</li>)}</ul><a href="/#contact">Discuss this service <I.ArrowUpRight/></a><i className="card-beam"/></article>)}</div>
      </section>

      <section className="engagement reveal">
        <div className="engagement-copy"><span className="services-eyebrow">HOW WE CAN HELP</span><h2>Start with your<br/><em>business challenge.</em></h2><p>You don’t need to arrive with a perfect brief. Tell us what needs to change, and we’ll help define the right engagement.</p><div className="model-tabs" role="tablist">{models.map((model,i)=><button role="tab" aria-selected={activeModel===i} className={activeModel===i?'active':''} onClick={()=>setActiveModel(i)} key={model.title}><span>0{i+1}</span>{model.title}<I.ChevronRight/></button>)}</div></div>
        <div className="model-display" key={activeModel}><div className="model-watermark">0{activeModel+1}</div><span className="model-icon"><ActiveIcon/></span><small>{models[activeModel].label}</small><h3>{models[activeModel].title}</h3><p>{models[activeModel].text}</p><div>{models[activeModel].points.map(point=><span key={point}><I.CircleCheck/>{point}</span>)}</div><SiteButton href="/#contact">Plan this engagement</SiteButton></div>
      </section>

      <section className="delivery reveal">
        <div className="delivery-head"><span className="services-eyebrow">THE MIKENIUM METHOD</span><h2>Clarity at every step.<br/><em>Momentum every week.</em></h2><p>A practical, transparent process that keeps decisions close, risks visible, and the product moving.</p></div>
        <div className="delivery-track">{process.map(([Icon,title,text],i)=><article key={title}><span className="step-number">0{i+1}</span><div className="step-icon"><Icon/></div><h3>{title}</h3><p>{text}</p>{i<process.length-1&&<span className="step-line"><i/></span>}</article>)}</div>
        <div className="delivery-note"><span><I.CalendarCheck/> Weekly progress you can see</span><span><I.MessageSquareMore/> Direct access to your team</span><span><I.ShieldCheck/> Quality checked continuously</span></div>
      </section>

      <section className="technology reveal"><div><span className="services-eyebrow">MODERN BY DEFAULT</span><h2>The right technology,<br/>chosen for the <em>right reason.</em></h2></div><div className="stack-grid">{stack.map((item,i)=><span key={item}><b>{String(i+1).padStart(2,'0')}</b>{item}</span>)}</div></section>

      <section className="service-cta reveal"><div className="service-cta-grid"/><span className="cta-symbol"><I.Sparkles/></span><div><small>YOUR NEXT MOVE STARTS HERE</small><h2>Have a challenge worth solving?</h2><p>Let’s turn it into clear decisions, useful software, and measurable progress.</p></div><SiteButton href="/#contact">Start a conversation</SiteButton></section>
    </main>
    <Footer/>
  </div>
}
