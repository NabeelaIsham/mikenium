import React, { useState } from 'react';
import * as I from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ListingPage, SettingsPage, BackupPage, ViewSite, listingNames } from './AdminPages';

const navGroups = [
  { label: '', items: [['Dashboard', I.LayoutDashboard]] },
  { label: 'MANAGEMENT', items: [['Users', I.Users], ['Clients', I.Contact], ['Projects', I.BriefcaseBusiness], ['Services', I.BadgeCheck], ['Products', I.Gift], ['Blogs', I.NotebookTabs], ['Testimonials', I.MessageSquare], ['Contact Messages', I.Mail]] },
  { label: 'CMS', items: [['Pages', I.File], ['Menus', I.List], ['Media Library', I.Images], ['Sliders', I.GalleryHorizontal]] },
  { label: 'SYSTEM', items: [['Roles & Permissions', I.ShieldCheck], ['Settings', I.Settings], ['Activity Logs', I.History], ['System Backup', I.DatabaseBackup]] }
];

const stats = [
  ['Total Users', '1,248', '12.5%', I.Users, 'blue'], ['Total Clients', '342', '8.3%', I.Building2, 'green'],
  ['Total Projects', '156', '15.2%', I.Folder, 'purple'], ['Total Products', '72', '6.1%', I.ShoppingBag, 'orange'],
  ['Total Blogs', '48', '10.7%', I.NotebookText, 'pink']
];
const chart = [
  {d:'May 15', Users:500, Projects:260, Clients:90}, {d:'', Users:580, Projects:280, Clients:90},
  {d:'May 16', Users:660, Projects:330, Clients:130}, {d:'', Users:600, Projects:280, Clients:90},
  {d:'May 17', Users:700, Projects:400, Clients:170}, {d:'', Users:710, Projects:400, Clients:150},
  {d:'May 18', Users:800, Projects:460, Clients:200}, {d:'', Users:870, Projects:480, Clients:250},
  {d:'May 19', Users:950, Projects:570, Clients:315}, {d:'', Users:900, Projects:590, Clients:280},
  {d:'May 21', Users:960, Projects:700, Clients:360}
];
const activities = [
  ['New user registered','John Doe registered as a new user.','2 mins ago',I.UserPlus,'blue'],
  ['New project created','EazyStore - Ecommerce Platform','15 mins ago',I.LayoutPanelTop,'green'],
  ['New blog published','How AI is Transforming Software Development','1 hour ago',I.Newspaper,'purple'],
  ['New message received','Message from the contact form by Michael Brown','2 hours ago',I.Mail,'orange'],
  ['New client added','TechSolutions Inc. has been added as a new client.','3 hours ago',I.Building2,'blue']
];
const people = [
  ['SJ','Sarah Johnson','sarah.j@example.com','Editor','10 mins ago'], ['DS','David Smith','david.s@example.com','Client','25 mins ago'],
  ['LW','Laura Wilson','laura.w@example.com','Author','1 hour ago'], ['JT','James Taylor','james.t@example.com','Subscriber','2 hours ago'],
  ['ED','Emily Davis','emily.d@example.com','Client','3 hours ago']
];
const services = [{name:'Web Development',value:45,color:'#0874e8'}, {name:'Mobile Development',value:38,color:'#35b96f'}, {name:'UI/UX Design',value:29,color:'#8a59dd'}, {name:'Cloud Solutions',value:24,color:'#ffb42e'}, {name:'Other Services',value:20,color:'#6fa9ef'}];

function Logo(){return <div className="logo"><div className="mark"><i/><b/></div><div><strong>MIKENIUM</strong><small>Building Smarter Software</small></div></div>}
function Sidebar({open,setOpen,active,onSelect}) { const go=n=>{onSelect(n);setOpen(false)};return <aside className={open?'sidebar open':'sidebar'}>
  <Logo/><nav>{navGroups.map((g,gi)=><section key={gi}>{g.label&&<label>{g.label}</label>}{g.items.map(([n,Icon])=><button onClick={()=>go(n)} className={n===active?'active':''} key={n}><Icon size={18}/><span>{n}</span></button>)}</section>)}</nav>
  <button className={active==='View Site'?'visit active':'visit'} onClick={()=>go('View Site')}><I.Globe2 size={18}/> View Site <I.ExternalLink size={16}/></button><footer>© 2024 Mikenium<br/><span>All Rights Reserved.</span></footer>
  <button className="mobile-close" onClick={()=>setOpen(false)}><I.X/></button>
  </aside> }
function Header({toggle,title}) { const [dark,setDark]=useState(false);return <header><button className="icon-button" onClick={toggle}><I.Menu/></button><b>{title}</b><div className="header-actions"><button className="header-icon" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<I.Sun/>:<I.Moon/>}</button><span className="bell"><I.Bell/><i>5</i></span><div className="avatar">SA</div><div className="admin"><b>Super Admin</b><small>superadmin@mikenium.com</small></div><I.ChevronDown size={16}/></div></header> }
function StatCard({s}) { const [title,num,up,Icon,color]=s; return <div className="stat card"><div className={'stat-icon '+color}><Icon/></div><div><small>{title}</small><strong>{num}</strong><p>↑ {up} <span>vs last 7 days</span></p></div></div> }
function PlatformChart(){ return <div className="card overview"><div className="card-title"><b>Platform Overview</b><div className="legend"><i className="dot blue-bg"/>Users <i className="dot green-bg"/>Projects <i className="dot purple-bg"/>Clients</div><button>Last 7 Days <I.ChevronDown size={14}/></button></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{top:15,right:12,left:-22,bottom:0}}><defs>{[['u','#0874e8'],['p','#36b76d'],['c','#8c5ce5']].map(x=><linearGradient key={x[0]} id={x[0]} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={x[1]} stopOpacity=".12"/><stop offset="1" stopColor={x[1]} stopOpacity="0"/></linearGradient>)}</defs><CartesianGrid stroke="#eaf0f7" vertical={true}/><XAxis dataKey="d" tick={{fontSize:10,fill:'#66758f'}} axisLine={false} tickLine={false}/><YAxis domain={[0,1000]} tick={{fontSize:10,fill:'#66758f'}} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="Users" stroke="#0874e8" fill="url(#u)" strokeWidth={2} dot={{r:2}}/><Area type="monotone" dataKey="Projects" stroke="#36b76d" fill="url(#p)" strokeWidth={2} dot={{r:2}}/><Area type="monotone" dataKey="Clients" stroke="#8c5ce5" fill="url(#c)" strokeWidth={2} dot={{r:2}}/></AreaChart></ResponsiveContainer></div></div>}
function Summary(){const rows=[[I.UserRound,'Active Users','892','green'],[I.Building2,'Active Clients','245','blue'],[I.Folder,'Running Projects','78','purple'],[I.BadgeHelp,'Support Tickets','16','orange'],[I.Mail,'Contact Messages','23','blue']];return <div className="card summary"><h3>System Summary</h3>{rows.map(([Icon,n,v,c])=><div className="summary-row" key={n}><span className={'mini '+c}><Icon/></span><span>{n}</span><b>{v}</b>{n==='Support Tickets'&&<em>Open</em>}</div>)}</div>}
function Activities(){return <div className="card panel"><h3>Recent Activities</h3><div className="rows">{activities.map(([a,b,t,Icon,c])=><div className="activity" key={a}><span className={'round '+c}><Icon/></span><div><b>{a}</b><small>{b}</small></div><time>{t}</time></div>)}</div><a>View All Activities <I.ArrowRight/></a></div>}
function Services(){return <div className="card panel services"><h3>Top Services</h3><div className="service-body"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={services} dataKey="value" innerRadius={48} outerRadius={73} paddingAngle={2}>{services.map(s=><Cell key={s.name} fill={s.color}/>)}</Pie></PieChart></ResponsiveContainer><div><small>Total</small><b>156</b></div></div><div className="service-list">{services.map(s=><p key={s.name}><i style={{background:s.color}}/>{s.name}<b>{s.value}</b><small>({(s.value/1.56).toFixed(1)}%)</small></p>)}</div></div><a>View All Services <I.ArrowRight/></a></div>}
function Users(){return <div className="card panel"><h3>Recent Users</h3><div className="rows">{people.map(([ini,n,e,r,t],idx)=><div className="person" key={n}><span className={'photo p'+idx}>{ini}</span><div><b>{n}</b><small>{e}</small></div><em className={r.toLowerCase()}>{r}</em><time>{t}</time></div>)}</div><a>View All Users <I.ArrowRight/></a></div>}
function Status(){return <div className="card status"><div><span className="status-icon"><I.ShieldCheck/></span><p><small>System Status</small><b className="ok">All Systems Operational</b></p></div><div><span className="status-icon"><I.Server/></span><p><small>Server Uptime</small><b>99.9%</b><em>Last 30 days</em></p></div><div><span className="status-icon"><I.Database/></span><p><small>Total Storage</small><b>256.8 GB / 1 TB</b><span className="progress"><i/></span></p></div><div><span className="status-icon green"><I.HardDriveDownload/></span><p><small>Last Backup</small><b>May 21, 2024 02:30 AM</b><a>(View Logs)</a></p></div></div>}
function Dashboard(){return <div className="content"><div className="welcome"><div><h1>Welcome back, Super Admin! 👋</h1><p>Here's what's happening with your platform today.</p></div><button><I.CalendarDays/> May 15, 2024 - May 21, 2024 <I.ChevronDown/></button></div><div className="stats">{stats.map(s=><StatCard key={s[0]} s={s}/>)}</div><div className="middle"><PlatformChart/><Summary/></div><div className="bottom"><Activities/><Services/><Users/></div><Status/></div>}
function CurrentPage({active}){if(active==='Dashboard')return <Dashboard/>;if(active==='Settings')return <SettingsPage/>;if(active==='System Backup')return <BackupPage/>;if(active==='View Site')return <ViewSite/>;if(listingNames.includes(active))return <ListingPage name={active}/>;return <Dashboard/>}
export default function App(){const [open,setOpen]=useState(false);const [active,setActive]=useState('Dashboard');return <div className="app"><Sidebar open={open} setOpen={setOpen} active={active} onSelect={setActive}/>{open&&<div className="scrim" onClick={()=>setOpen(false)}/>}<main><Header title={active} toggle={()=>setOpen(!open)}/><CurrentPage active={active}/></main></div>}
