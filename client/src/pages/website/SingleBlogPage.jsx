import React, { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import '../../styles/single-blog-page.css';

const sections=[['state','The web, redefined'],['technologies','Technologies to watch'],['trends','Signals shaping the future'],['prepare','How teams can prepare'],['thoughts','Final thoughts']];
const technologies=[
  [I.Atom,'React & Next.js','Composable interfaces, server rendering, and a smoother path from idea to production.'],
  [I.Braces,'Type-safe JavaScript','TypeScript makes ambitious codebases clearer, safer, and easier to evolve.'],
  [I.CloudCog,'Cloud & serverless','Elastic infrastructure lets teams move quickly without carrying unnecessary complexity.'],
  [I.Sparkles,'Applied AI','AI is becoming a practical collaborator across discovery, delivery, and support.'],
  [I.ShieldCheck,'Secure by design','Resilient software treats privacy and security as product features from day one.'],
  [I.Gauge,'Web performance','Core Web Vitals and instant feedback remain central to trust and conversion.']
];
const related=[
  ['Cloud','Cloud-Native Without the Complexity','6 min'],
  ['Design','Designing Interfaces People Trust Instantly','5 min'],
  ['Engineering','Clean Code Is a Business Advantage','6 min']
];

function Logo(){return <a className="public-logo" href="/" aria-label="Mikenium home"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/></a>}
function SiteButton({children,href='/contact'}){return <a className="site-button" href={href}>{children}<I.ArrowRight/></a>}
function Header({menu,setMenu,scrolled}){return <header className={'public-header '+(scrolled?'scrolled ':'')+(menu?'menu-open':'')}><Logo/><div className="nav-center"><nav className={menu?'open':''}>{[['Home','/'],['Services','/services'],['Portfolio','/portfolio'],['Products','/products'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']].map(([label,href],index)=><a className={label==='Blog'?'active':''} onClick={()=>setMenu(false)} href={href} key={label}><span>0{index+1}</span>{label}</a>)}</nav></div><div className="nav-actions"><a className="nav-contact" href="/contact"><span>Start a Project</span><I.ArrowUpRight/></a><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>{menu?<I.X/>:<I.Menu/>}</button></div></header>}
function Footer(){return <footer id="contact"><div className="footer-glow"/><div className="cta"><div><span className="cta-label"><i/> LET’S CREATE TOGETHER</span><h2>Ready to build software<br/>that moves your business?</h2><p>Bring us the challenge. We’ll bring the strategy, design, and engineering to turn it into a product people value.</p></div><div className="cta-actions"><SiteButton>Start a Conversation</SiteButton><a href="mailto:hello@mikenium.com">hello@mikenium.com <I.ArrowUpRight/></a></div></div><div className="footer-main"><div className="footer-about"><img src="/assets/mikenium-logo-transparent.png" alt="Mikenium — Building Smarter Software"/><p>We design and engineer secure digital products that help ambitious businesses grow with confidence.</p><span className="footer-socials">{[I.Facebook,I.Linkedin,I.Twitter,I.Github,I.Instagram].map((Icon,i)=><a href="/" aria-label="Social link" key={i}><Icon/></a>)}</span></div><div className="footer-links"><div><h4>Company</h4>{[['About Us','/about'],['Our Work','/portfolio'],['Careers','/#contact'],['Contact','/contact']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div><div><h4>Expertise</h4>{['Web Development','Mobile Apps','Cloud Solutions','UI/UX Design'].map(x=><a href="/services#capabilities" key={x}>{x}</a>)}</div><div><h4>Resources</h4>{[['Insights','/blog'],['Products','/products'],['Pricing','/pricing'],['Client Stories','/portfolio']].map(([label,href])=><a href={href} key={label}>{label}</a>)}</div></div><div className="footer-contact"><span><I.MapPin/></span><div><h4>Let’s talk about your next idea.</h4><a href="mailto:hello@mikenium.com">hello@mikenium.com</a><a href="tel:+94112345678">+94 11 234 5678</a><small>Colombo, Sri Lanka</small></div></div></div><div className="footer-bottom"><p>© 2026 Mikenium. All rights reserved.</p><nav><a href="/">Privacy Policy</a><a href="/">Terms of Service</a><a href="/">Cookie Policy</a></nav><span><i/> All systems operational</span></div></footer>}

export default function SingleBlogPage(){
  const [menu,setMenu]=useState(false),[scrolled,setScrolled]=useState(false),[progress,setProgress]=useState(0),[active,setActive]=useState('state'),[copied,setCopied]=useState(false);
  useEffect(()=>{
    document.title='The Future of Web Development | Mikenium';
    const onScroll=()=>{setScrolled(window.scrollY>20);const height=document.documentElement.scrollHeight-window.innerHeight;setProgress(height?Math.min(100,window.scrollY/height*100):0)};
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
    const reveal=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting&&e.target.classList.add('is-visible')),{threshold:.08});
    document.querySelectorAll('.single-blog-page .reveal').forEach(el=>reveal.observe(el));
    const watch=new IntersectionObserver(entries=>entries.forEach(e=>e.isIntersecting&&setActive(e.target.id)),{rootMargin:'-25% 0px -60%',threshold:0});
    sections.forEach(([id])=>{const el=document.getElementById(id);if(el)watch.observe(el)});
    return()=>{window.removeEventListener('scroll',onScroll);reveal.disconnect();watch.disconnect()};
  },[]);
  const share=async()=>{try{if(navigator.share){await navigator.share({title:document.title,url:window.location.href})}else{await navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),1800)}}catch{ /* sharing was dismissed */ }};
  return <div className="public-site single-blog-page">
    <div className="reading-progress" style={{transform:`scaleX(${progress/100})`}}/>
    <Header menu={menu} setMenu={setMenu} scrolled={scrolled}/>
    <main>
      <section className="article-hero"><div className="article-grid"/><div className="article-glow one"/><div className="article-glow two"/><div className="article-hero-inner"><nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><I.ChevronRight/><a href="/blog">Journal</a><I.ChevronRight/><span>Engineering</span></nav><div className="article-eyebrow"><span><I.Code2/> ENGINEERING</span><i/> MAY 20, 2026</div><h1>The future of web development is <em>already being built.</em></h1><p>What ambitious product teams need to know about the technologies, principles, and human decisions shaping the next era of the web.</p><div className="article-byline"><span className="author-avatar">NP</span><div><b>Nuwan Perera</b><small>Founder & Product Strategist</small></div><span className="meta-divider"/><span><I.Clock3/> 8 min read</span><span><I.CalendarDays/> May 20, 2026</span><button onClick={share}>{copied?<I.Check/>:<I.Share2/>}{copied?'Link copied':'Share article'}</button></div></div></section>

      <div className="article-shell">
        <article className="article-body">
          <figure className="article-cover reveal"><div className="cover-code"><span>mikenium.dev</span><i/><i/><i/><b>build( tomorrow )</b></div><figcaption><span>MIKENIUM / ENGINEERING NOTES</span><span>01 — 06</span></figcaption></figure>
          <div className="article-intro reveal"><p className="lead">The web is evolving faster than ever. New technologies arrive weekly, but meaningful progress comes from knowing which changes create real value—and which are simply noise.</p><p>For modern software companies, the opportunity is bigger than adopting another framework. It is about building faster, more inclusive, more resilient experiences while keeping the product easy to change.</p></div>

          <section id="state" className="article-section reveal"><span className="section-count">01</span><div><span className="article-kicker">THE NEW BASELINE</span><h2>The web, redefined.</h2><p>We have moved far beyond static pages. Today’s best web products blend the reach of the browser with the responsiveness of native software. They are personalized, accessible, connected in real time, and available across devices.</p><p>The real shift is architectural: teams are choosing composable systems, moving intelligence closer to the user, and treating performance as part of the experience—not a technical afterthought.</p><blockquote><I.Quote/><p>The best way to predict the future is to build it with intention.</p><cite>— A principle we build by at Mikenium</cite></blockquote></div></section>

          <section id="technologies" className="article-section reveal"><span className="section-count">02</span><div><span className="article-kicker">THE PRACTICAL TOOLKIT</span><h2>Technologies worth watching.</h2><p>Trends matter only when they help teams solve a real problem. These are the capabilities moving from promising experiments into everyday product work.</p><div className="technology-grid">{technologies.map(([Icon,title,text],i)=><article key={title}><span><Icon/></span><small>0{i+1}</small><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

          <section id="trends" className="article-section reveal"><span className="section-count">03</span><div><span className="article-kicker">WHAT CHANGES NEXT</span><h2>Signals shaping the future.</h2><div className="trend-feature"><div className="trend-visual"><div className="signal-ring r1"/><div className="signal-ring r2"/><I.Network/><span>HUMAN × MACHINE</span></div><div className="trend-list">{[['Interfaces become adaptive','Experiences will respond to context, intent, and accessibility needs.'],['AI moves inside the workflow','Useful copilots will appear exactly where decisions are made.'],['The edge becomes invisible','Faster delivery and real-time features will feel like the default.'],['Simplicity wins','The strongest teams will reduce complexity instead of celebrating it.']].map(([title,text],i)=><div key={title}><span>0{i+1}</span><p><b>{title}</b><small>{text}</small></p></div>)}</div></div></div></section>

          <section id="prepare" className="article-section reveal"><span className="section-count">04</span><div><span className="article-kicker">FROM TREND TO ADVANTAGE</span><h2>How teams can prepare.</h2><p>You do not need to rebuild everything. Start by creating the conditions for good decisions and steady evolution.</p><ul className="prepare-list"><li><I.CircleCheck/><span><b>Design around outcomes</b><small>Measure user and business value, not the number of features shipped.</small></span></li><li><I.CircleCheck/><span><b>Build on strong foundations</b><small>Prioritize accessibility, observability, security, and performance early.</small></span></li><li><I.CircleCheck/><span><b>Keep architecture reversible</b><small>Choose modular systems that can change as your understanding grows.</small></span></li><li><I.CircleCheck/><span><b>Invest in the team</b><small>Tools accelerate capable people; they never replace product judgment.</small></span></li></ul></div></section>

          <section id="thoughts" className="article-section final-section reveal"><span className="section-count">05</span><div><span className="article-kicker">FINAL THOUGHTS</span><h2>The future belongs to thoughtful builders.</h2><p>The next era of the web will not be defined by one framework or device. It will be shaped by teams that combine technical ambition with empathy, clarity, and an appetite for continuous learning.</p><div className="article-cta"><span><I.Send/></span><div><small>HAVE A PRODUCT IDEA?</small><h3>Let’s build the useful future.</h3><p>Turn emerging technology into software people genuinely value.</p></div><SiteButton>Start a project</SiteButton></div></div></section>

          <div className="article-navigation reveal"><a href="/blog"><I.ArrowLeft/><span><small>PREVIOUS INSIGHT</small><b>Cloud-Native Without the Complexity</b></span></a><a href="/blog"><span><small>NEXT INSIGHT</small><b>Designing Interfaces People Trust</b></span><I.ArrowRight/></a></div>
        </article>

        <aside className="article-sidebar">
          <div className="toc-card"><span className="side-label">IN THIS ARTICLE</span><div className="toc-line">{sections.map(([id,label],i)=><a className={active===id?'active':''} href={`#${id}`} key={id}><i/><span>0{i+1}</span>{label}</a>)}</div><div className="read-status"><span style={{width:`${progress}%`}}/><small>{Math.round(progress)}% read</small></div></div>
          <div className="author-card"><div className="author-top"><span>NP</span><div><small>WRITTEN BY</small><h3>Nuwan Perera</h3><p>Founder & Product Strategist</p></div></div><p>Building useful digital products at the intersection of strategy, design, and engineering.</p><div className="author-socials"><a href="/" aria-label="LinkedIn"><I.Linkedin/></a><a href="/" aria-label="Twitter"><I.Twitter/></a><a href="mailto:hello@mikenium.com" aria-label="Email"><I.Mail/></a><button onClick={share} aria-label="Share article"><I.Share2/></button></div></div>
          <div className="related-card"><span className="side-label">KEEP EXPLORING</span><h3>Related insights</h3>{related.map(([tag,title,time],i)=><a href="/blog" key={title}><span className={`related-thumb t${i}`}><I.ArrowUpRight/></span><div><small>{tag} · {time}</small><b>{title}</b></div></a>)}</div>
          <div className="side-newsletter"><I.MailPlus/><span className="side-label">THE USEFUL UPDATE</span><h3>Ideas for building what’s next.</h3><p>Two thoughtful emails a month. No noise.</p><form onSubmit={e=>e.preventDefault()}><input type="email" placeholder="you@company.com" aria-label="Email address" required/><button>Subscribe <I.ArrowRight/></button></form></div>
        </aside>
      </div>
    </main>
    <Footer/>
  </div>
}
