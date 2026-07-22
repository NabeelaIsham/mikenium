import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import '../../styles/about-page.css';
import {companyContact,footerNavigation} from '../../config/site-contact';

const metrics = [[I.BriefcaseBusiness,'100+','Products shipped'],[I.HeartHandshake,'50+','Client partnerships'],[I.Award,'5+','Years building'],[I.Headphones,'24/7','Support coverage']];
const values = [[I.UsersRound,'Collaboration','The strongest products are shaped together—with open minds and shared ownership.'],[I.Lightbulb,'Innovation','We stay curious, challenge assumptions, and find simpler answers to hard problems.'],[I.ShieldCheck,'Integrity','Clear communication, honest decisions, and accountability at every step.'],[I.Gem,'Excellence','Craft matters. We sweat the details that make software reliable and memorable.'],[I.Heart,'Passion','We care deeply about the work, the people using it, and the outcomes it creates.']];
const process = [[I.Search,'Discover','We unpack the business problem, users, risks, and the result that matters.'],[I.PenTool,'Design','We turn insight into a clear product direction and intuitive experience.'],[I.Code2,'Build','Our engineers ship secure, maintainable software in visible iterations.'],[I.LineChart,'Evolve','We measure, learn, support, and improve long after the first release.']];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src={companyContact.logoUrl} alt={companyContact.logoAlt}/></a>}
function ArrowLink({children,href='/#contact',ghost=false}){return <a className={'about-button'+(ghost?' ghost':'')} href={href}>{children}<I.ArrowUpRight/></a>}
function SiteButton({children,href='/#contact'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}

export default function AboutPage(){
  const [menu,setMenu]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>20);fn();window.addEventListener('scroll',fn,{passive:true});const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('is-visible')),{threshold:.12});document.querySelectorAll('.about-page .reveal').forEach(el=>observer.observe(el));return()=>{window.removeEventListener('scroll',fn);observer.disconnect()}},[]);
  return <div className="public-site about-page">
    <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}><Logo/><div className="nav-center"><nav className={menu?'open':''}>{[['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']].map(([label,href],index)=><a className={label==='About'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>0{index+1}</span>{label}</a>)}</nav></div><div className="nav-actions"><a className="nav-contact" href="/contact"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div></header>

    <main>
      <section className="about-hero">
        <div className="about-grid"/><div className="about-aurora a1"/><div className="about-aurora a2"/>
        <div className="about-hero-copy">
          <span className="about-kicker"><i/> ABOUT MIKENIUM</span>
          <h1>We make complex<br/>feel <em>remarkably</em><br/><span>simple.</span></h1>
          <p>We’re a software company that turns ambitious ideas into useful, scalable digital products—built with strategy, care, and modern technology.</p>
          <div className="about-actions"><ArrowLink>Explore our services</ArrowLink><ArrowLink href="#story" ghost>Meet Mikenium</ArrowLink></div>
          <div className="about-scroll"><span><I.MousePointer2/></span><i/> Scroll to discover</div>
        </div>
        <div className="about-hero-stage" aria-label="Mikenium digital product studio illustration">
          <div className="stage-orbit orbit-one"/><div className="stage-orbit orbit-two"/>
          <div className="studio-card">
            <div className="studio-top"><span><i/><i/><i/></span><b>MIKENIUM / STUDIO</b><small>LIVE</small></div>
            <div className="studio-canvas"><div className="canvas-mark"><I.CodeXml/></div><strong>Ideas engineered<br/><span>into impact.</span></strong><div className="code-lines"><i/><i/><i/></div></div>
            <div className="studio-bottom"><span>STRATEGY</span><i/><span>DESIGN</span><i/><span>ENGINEERING</span></div>
          </div>
          <div className="float-chip chip-one"><span><I.Sparkles/></span><div><b>Human-led</b><small>Thoughtful by design</small></div></div>
          <div className="float-chip chip-two"><span><I.GitBranch/></span><div><b>Built to scale</b><small>Future-ready systems</small></div></div>
          <div className="float-chip chip-three"><span><I.ShieldCheck/></span><div><b>Secure by default</b><small>Quality at every layer</small></div></div>
        </div>
      </section>

      <section className="about-metrics reveal" aria-label="Company metrics">{metrics.map(([Icon,num,label])=><article key={label}><span><Icon/></span><div><strong>{num}</strong><small>{label}</small></div></article>)}</section>

      <section className="about-story reveal" id="story">
        <div className="story-visual"><div className="story-photo"><img src="/assets/about-team-studio-v2.png" alt="Mikenium product team collaborating in our software studio"/><span className="photo-caption"><i/> COLOMBO · SRI LANKA</span></div><div className="impact-badge"><I.TrendingUp/><span><b>Real impact</b><small>Not just deliverables</small></span></div><div className="story-quote"><I.Quote/><p>Technology works best when it feels human.</p></div></div>
        <div className="story-copy"><span className="section-kicker">WHO WE ARE</span><h2>Builders, thinkers, and<br/><span>problem solvers.</span></h2><p>Our mission is to empower businesses with intelligent, scalable, future-ready software. We combine product thinking, purposeful design, and robust engineering to turn uncertainty into products people trust.</p>
          <div className="beliefs">
            <article><span><I.Target/></span><div><h3>Our mission</h3><p>Deliver innovative software that drives growth and creates long-term value.</p></div></article>
            <article><span><I.Eye/></span><div><h3>Our vision</h3><p>Be a global software partner known for quality, transparency, and client success.</p></div></article>
            <article><span><I.BadgeCheck/></span><div><h3>Our promise</h3><p>Deliver with collaboration, integrity, and continuous improvement.</p></div></article>
          </div>
        </div>
      </section>

      <section className="about-process reveal">
        <div className="process-head"><span className="section-kicker">HOW WE CREATE MOMENTUM</span><h2>From first question to<br/><span>lasting advantage.</span></h2><p>A focused, transparent way of working that keeps your team close to every decision and every release.</p></div>
        <div className="process-track">{process.map(([Icon,title,text],i)=><article key={title}><span className="process-number">0{i+1}</span><div className="process-icon"><Icon/></div><h3>{title}</h3><p>{text}</p>{i<process.length-1&&<I.ArrowRight className="process-arrow"/>}</article>)}</div>
        <div className="process-proof"><span><I.CheckCircle2/> Senior expertise, hands-on</span><span><I.CheckCircle2/> Progress you can see weekly</span><span><I.CheckCircle2/> No black boxes or surprises</span></div>
      </section>

      <section className="about-values reveal">
        <div className="values-head"><div><span className="section-kicker">OUR OPERATING SYSTEM</span><h2>Principles that show up<br/>in every <span>pixel and commit.</span></h2></div><p>Values only matter when they shape the work. Ours guide how we collaborate, make decisions, and measure success.</p></div>
        <div className="value-grid">{values.map(([Icon,title,text],i)=><article key={title}><span className="value-index">0{i+1}</span><div className="value-icon"><Icon/></div><h3>{title}</h3><p>{text}</p><i className="value-line"/></article>)}</div>
      </section>

    </main>

    <footer id="contact"><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton>Start a Conversation</SiteButton><a href={companyContact.emailHref}>{companyContact.email} <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{companyContact.socialLinks.map(item=>{const Icon=item.Icon;return <a href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label} key={item.label}><Icon/></a>})}</span></div><div className="footer-links">{footerNavigation.map(section=><div key={section.title}><h4>{section.title}</h4>{section.links.map(link=><a href={link.href} key={link.label}>{link.label}</a>)}</div>)}</div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href={companyContact.emailHref}>{companyContact.email}</a>{companyContact.phones.map(phone=><a href={phone.href} key={phone.href}>{phone.label}</a>)}<small>{companyContact.address}</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>
  </div>
}
