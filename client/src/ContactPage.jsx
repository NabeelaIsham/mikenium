import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import './contact-page.css';

const navItems = [['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about'],['Contact','/contact']];
const channels = [
  [I.Mail,'Email us','hello@mikenium.com','We reply within one business day','mailto:hello@mikenium.com','email'],
  [I.Phone,'Call us','+94 11 234 5678','Monday–Friday · 9:00–18:00','tel:+94112345678','phone'],
  [I.MessageCircle,'WhatsApp','Chat with our team','Start a quick conversation','https://wa.me/94112345678','whatsapp'],
  [I.CalendarDays,'Book a meeting','30-minute discovery call','Choose a time that works for you','#contact-form','meeting']
];
const reasons = [[I.Fingerprint,'Built around you','Solutions shaped around your goals, users, and workflow.'],[I.TimerReset,'Momentum, weekly','Clear progress, visible decisions, and reliable delivery.'],[I.ShieldCheck,'Secure by design','Quality and security considered at every layer.'],[I.Handshake,'A lasting partner','We stay invested well beyond the first release.']];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/></a>}
function SiteButton({children,href='/contact'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}

function Header(){
  const [menu,setMenu]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>20);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll)},[]);
  return <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}>
    <Logo/><div className="nav-center"><nav className={menu?'open':''}>{navItems.map(([label,href],index)=><a className={label==='Contact'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>{String(index+1).padStart(2,'0')}</span>{label}</a>)}</nav></div>
    <div className="nav-actions"><a className="nav-contact" href="#contact-form"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div>
  </header>
}

function Footer(){return <footer><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton href="#contact-form">Start a Conversation</SiteButton><a href="mailto:hello@mikenium.com">hello@mikenium.com <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{[I.Facebook,I.Linkedin,I.Twitter,I.Github,I.Instagram].map((Icon,i)=><a href="/" aria-label="Social link" key={i}><Icon/></a>)}</span></div><div className="footer-links"><div><h4>Company</h4>{[['About Us','/about'],['Our Work','/portfolio'],['Careers','/contact'],['Contact','/contact']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div><div><h4>Expertise</h4>{['Web Development','Mobile Apps','Cloud Solutions','UI/UX Design'].map(x=><a href="/services#capabilities" key={x}>{x}</a>)}</div><div><h4>Resources</h4>{[['Insights','/blog'],['Products','/products'],['Pricing','/pricing'],['Client Stories','/portfolio']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div></div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href="mailto:hello@mikenium.com">hello@mikenium.com</a><a href="tel:+94112345678">+94 11 234 5678</a><small>Colombo, Sri Lanka</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>}

export default function ContactPage(){
  const [sent,setSent]=useState(false);
  useEffect(()=>{document.title='Contact Mikenium | Let’s Build What’s Next';const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('is-visible')),{threshold:.12});document.querySelectorAll('.contact-page .reveal').forEach(el=>observer.observe(el));return()=>observer.disconnect()},[]);
  const submit=e=>{e.preventDefault();setSent(true);e.currentTarget.reset();};
  return <div className="public-site contact-page">
    <Header/>
    <main>
      <section className="contact-hero">
        <div className="contact-grid"/><div className="contact-beam beam-one"/><div className="contact-beam beam-two"/>
        <div className="contact-hero-copy">
          <span className="contact-kicker"><i/> CONTACT MIKENIUM</span>
          <h1>Great software starts<br/>with a <span>real conversation.</span></h1>
          <p>Tell us what you’re building, what’s getting in the way, or simply where you want to go. We’ll help make the next step clear.</p>
          <div className="contact-hero-actions"><a href="#contact-form">Start the conversation <I.ArrowDownRight/></a><a href="mailto:hello@mikenium.com">hello@mikenium.com <I.Copy/></a></div>
          <div className="contact-promises"><span><I.Clock3/><b>Within 24 hours</b><small>Typical response time</small></span><span><I.UserRoundCheck/><b>Talk to an expert</b><small>No sales runaround</small></span><span><I.LockKeyhole/><b>Confidential</b><small>Your ideas stay yours</small></span></div>
        </div>
        <div className="contact-console" aria-label="Mikenium communication network illustration">
          <div className="console-orbit orbit-a"><i/><i/><i/></div><div className="console-orbit orbit-b"/>
          <div className="message-core"><div className="core-top"><span><i/> MIKENIUM CONNECT</span><small>ONLINE</small></div><div className="core-logo"><img src="/assets/mikenium-logo-transparent.png" alt=""/><span>Your next idea<br/><b>belongs in motion.</b></span></div><div className="signal-line"><i/><i/><i/><i/></div></div>
          <span className="signal-node node-mail"><I.Mail/></span><span className="signal-node node-chat"><I.MessageSquareText/></span><span className="signal-node node-send"><I.Send/></span>
          <div className="response-chip"><i/><span><b>Team available</b><small>Colombo · 09:42</small></span></div>
        </div>
      </section>

      <section className="contact-workspace reveal" id="contact-form">
        <div className="form-panel">
          <div className="panel-heading"><span><small>01</small><I.MessageSquareMore/></span><div><small>TELL US ABOUT THE CHALLENGE</small><h2>Let’s make something<br/><em>meaningful.</em></h2><p>A few details are enough to get the right people thinking.</p></div></div>
          {sent&&<div className="form-success" role="status"><I.CircleCheckBig/><span><b>Message ready to go.</b><small>Thanks — our team will be in touch within one business day.</small></span><button onClick={()=>setSent(false)} aria-label="Dismiss"><I.X/></button></div>}
          <form onSubmit={submit}>
            <label><span>Your name *</span><div><I.UserRound/><input name="name" placeholder="How should we address you?" required/></div></label>
            <label><span>Work email *</span><div><I.AtSign/><input name="email" type="email" placeholder="you@company.com" required/></div></label>
            <label><span>Company</span><div><I.Building2/><input name="company" placeholder="Your company or team"/></div></label>
            <label><span>What can we help with? *</span><div><I.Shapes/><select name="service" defaultValue="" required><option value="" disabled>Select a service</option><option>Web development</option><option>Mobile application</option><option>UI/UX design</option><option>Cloud & DevOps</option><option>Product strategy</option><option>Something else</option></select><I.ChevronDown className="select-arrow"/></div></label>
            <label className="full"><span>Tell us about your idea *</span><div className="textarea-wrap"><I.PencilLine/><textarea name="message" placeholder="The problem, the vision, the timeline — share whatever you know so far..." required/></div></label>
            <div className="form-bottom"><span><I.ShieldCheck/> Your information is private and never shared.</span><button type="submit">Send your message <I.Send/></button></div>
          </form>
        </div>
        <aside className="contact-aside">
          <div className="aside-head"><span>02</span><div><small>CHOOSE YOUR CHANNEL</small><h2>Reach us your way.</h2><p>Different question, same thoughtful response.</p></div></div>
          <div className="channel-list">{channels.map(([Icon,title,value,note,href,type])=><a href={href} className={type} key={title} target={href.startsWith('http')?'_blank':undefined} rel="noreferrer"><span><Icon/></span><div><b>{title}</b><strong>{value}</strong><small>{note}</small></div><I.ArrowUpRight className="channel-arrow"/></a>)}</div>
          <div className="availability"><span><i/></span><div><b>We’re currently online</b><small>Local time in Colombo · GMT+5:30</small></div><I.Wifi/></div>
        </aside>
      </section>

      <section className="contact-reasons reveal"><div className="reasons-head"><span>WHY MIKENIUM</span><h2>A better way to build,<br/><em>from hello onward.</em></h2></div><div className="reasons-grid">{reasons.map(([Icon,title,text],index)=><article key={title}><small>0{index+1}</small><span><Icon/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="office-section reveal">
        <div className="office-map"><div className="map-road r1"/><div className="map-road r2"/><div className="map-road r3"/><span className="map-label label-one">COLOMBO 03</span><span className="map-label label-two">GALLE FACE</span><span className="map-label label-three">BEIRA LAKE</span><div className="map-pin"><span><I.MapPin/></span><i/><em>Mikenium Studio</em></div></div>
        <div className="office-info"><span className="office-kicker">OUR STUDIO</span><h2>Global thinking.<br/><em>Colombo roots.</em></h2><p>Drop in for a working session, a coffee, or a conversation about the product you can’t stop thinking about.</p><div className="office-details"><span><I.MapPinned/><b>Mikenium (Pvt) Ltd</b><small>Colombo 07, Sri Lanka</small></span><span><I.Clock3/><b>Studio hours</b><small>Mon–Fri · 9:00 AM–6:00 PM</small></span><span><I.Globe2/><b>Working worldwide</b><small>Remote collaboration across time zones</small></span></div><a href="https://maps.google.com/?q=Colombo+Sri+Lanka" target="_blank" rel="noreferrer">Open in Maps <I.ArrowUpRight/></a></div>
      </section>
    </main>
    <Footer/>
  </div>
}
