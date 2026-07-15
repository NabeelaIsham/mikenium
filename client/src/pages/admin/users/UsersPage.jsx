import React, { useMemo, useState } from 'react';
import * as I from 'lucide-react';

const userSeed=[
  {name:'Super Admin',handle:'superadmin',email:'superadmin@mikenium.com',role:'Super Admin',status:'Active',verified:true,joined:'Jan 01, 2024',login:'May 21, 2024 10:30 AM',tone:'navy'},
  {name:'John Smith',handle:'johnsmith',email:'john.smith@mikenium.com',role:'Administrator',status:'Active',verified:true,joined:'Feb 14, 2024',login:'May 21, 2024 09:15 AM',tone:'amber'},
  {name:'Sarah Johnson',handle:'sarahj',email:'sarah.johnson@example.com',role:'Client',status:'Active',verified:true,joined:'Mar 05, 2024',login:'May 20, 2024 04:45 PM',tone:'rose'},
  {name:'Michael Brown',handle:'michaelb',email:'michael.brown@example.com',role:'Client',status:'Active',verified:false,joined:'Mar 18, 2024',login:'May 19, 2024 11:20 AM',tone:'blue'},
  {name:'Emily Davis',handle:'emilyd',email:'emily.davis@example.com',role:'Subscriber',status:'Active',verified:true,joined:'Apr 02, 2024',login:'May 21, 2024 08:00 AM',tone:'rose'},
  {name:'David Wilson',handle:'davidw',email:'david.wilson@example.com',role:'Client',status:'Inactive',verified:true,joined:'Apr 10, 2024',login:'—',tone:'teal'},
  {name:'Laura Martinez',handle:'lauram',email:'laura.martinez@example.com',role:'Subscriber',status:'Active',verified:true,joined:'Apr 15, 2024',login:'May 18, 2024 02:30 PM',tone:'amber'},
  {name:'James Taylor',handle:'jamest',email:'james.taylor@example.com',role:'Client',status:'Inactive',verified:false,joined:'Apr 22, 2024',login:'—',tone:'navy'},
  {name:'Olivia Anderson',handle:'oliviaa',email:'olivia.anderson@example.com',role:'Subscriber',status:'Active',verified:true,joined:'May 01, 2024',login:'May 21, 2024 07:45 AM',tone:'rose'},
  {name:'Daniel Thomas',handle:'danielt',email:'daniel.thomas@example.com',role:'Client',status:'Active',verified:true,joined:'May 05, 2024',login:'May 20, 2024 06:10 PM',tone:'blue'}
];

const userStats=[
  ['Total Users','1,248','12.5%',I.Users,'blue',true],
  ['Administrators','28','7.1%',I.ShieldCheck,'purple',true],
  ['Clients','342','8.3%',I.BriefcaseBusiness,'green',true],
  ['Subscribers','856','11.4%',I.Mail,'orange',true],
  ['Inactive Users','22','15.2%',I.UserRoundX,'pink',false]
];

function UserModal({onClose,onSave}){const [form,setForm]=useState({name:'',email:'',role:'Client'});const change=e=>setForm({...form,[e.target.name]:e.target.value});return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal user-modal" onMouseDown={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();onSave(form)}}><div className="modal-head"><div><h2>Add New User</h2><p>Create an account and assign its access level.</p></div><button type="button" onClick={onClose} aria-label="Close"><I.X/></button></div><label>Full name<input name="name" required autoFocus value={form.name} onChange={change} placeholder="e.g. Alex Morgan"/></label><label>Email address<input name="email" required type="email" value={form.email} onChange={change} placeholder="alex@example.com"/></label><label>Role<select name="role" value={form.role} onChange={change}><option>Administrator</option><option>Client</option><option>Subscriber</option></select></label><div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary"><I.UserPlus/> Add User</button></div></form></div>}

export function UsersPage(){
  const [users,setUsers]=useState(userSeed),[query,setQuery]=useState(''),[role,setRole]=useState('All Roles'),[status,setStatus]=useState('All Status'),[verified,setVerified]=useState('Email Verified'),[modal,setModal]=useState(false),[toast,setToast]=useState(''),[selected,setSelected]=useState([]);
  const filtered=useMemo(()=>users.filter(u=>{
    const matchesQuery=[u.name,u.handle,u.email,u.role].join(' ').toLowerCase().includes(query.toLowerCase());
    return matchesQuery&&(role==='All Roles'||u.role===role)&&(status==='All Status'||u.status===status)&&(verified==='Email Verified'||(verified==='Verified'?u.verified:!u.verified));
  }),[users,query,role,status,verified]);
  const flash=message=>{setToast(message);setTimeout(()=>setToast(''),2500)};
  const addUser=form=>{const handle=form.name.toLowerCase().replace(/[^a-z0-9]/g,'');setUsers([{...form,handle,status:'Active',verified:false,joined:'Jul 14, 2026',login:'—',tone:'blue'},...users]);setModal(false);flash('User added successfully')};
  const toggle=id=>setSelected(selected.includes(id)?selected.filter(x=>x!==id):[...selected,id]);
  const toggleAll=()=>setSelected(selected.length===filtered.length?[]:filtered.map(u=>u.email));
  const exportUsers=()=>{const header='Name,Username,Email,Role,Status,Email Verified,Joined,Last Login';const rows=filtered.map(u=>[u.name,u.handle,u.email,u.role,u.status,u.verified?'Yes':'No',u.joined,u.login].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','));const url=URL.createObjectURL(new Blob([[header,...rows].join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='mikenium-users.csv';a.click();URL.revokeObjectURL(url);flash('User list exported')};
  return <div className="users-page">
    <div className="users-heading"><div><h1>Users</h1><div className="users-crumb">Dashboard <I.ChevronRight/> <span>Users</span></div></div><button className="users-add" onClick={()=>setModal(true)}><I.Plus/> Add New User</button></div>
    <div className="user-stats">{userStats.map(([title,value,change,Icon,color,up])=><div className="card user-stat" key={title}><span className={`user-stat-icon ${color}`}><Icon/></span><div><small>{title}</small><b>{value}</b><p className={up?'up':'down'}>{up?<I.ArrowUp/>:<I.ArrowDown/>}{change}<span>vs last 7 days</span></p></div></div>)}</div>
    <div className="card users-table-card">
      <div className="users-toolbar"><div className="users-search"><I.Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users..."/></div><select value={role} onChange={e=>setRole(e.target.value)}><option>All Roles</option><option>Super Admin</option><option>Administrator</option><option>Client</option><option>Subscriber</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All Status</option><option>Active</option><option>Inactive</option></select><select value={verified} onChange={e=>setVerified(e.target.value)}><option>Email Verified</option><option>Verified</option><option>Not Verified</option></select><div className="toolbar-spacer"/><button className="date-button"><I.CalendarDays/> May 15, 2024 - May 21, 2024 <I.ChevronDown/></button><button><I.ListFilter/> Filter</button><button onClick={exportUsers}><I.Download/> Export</button></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr><th><input type="checkbox" checked={filtered.length>0&&selected.length===filtered.length} onChange={toggleAll}/></th><th>User</th><th>Role</th><th>Email</th><th>Status</th><th>Email Verified</th><th>Joined On <I.RotateCw/></th><th>Last Login <I.RotateCw/></th><th>Actions</th></tr></thead><tbody>{filtered.map(u=><tr key={u.email}><td><input type="checkbox" checked={selected.includes(u.email)} onChange={()=>toggle(u.email)}/></td><td><div className="user-identity"><span className={`user-avatar ${u.tone}`}>{u.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span><b>{u.name}</b><small>@{u.handle}</small></span></div></td><td><span className={`role-pill ${u.role.toLowerCase().replace(' ','-')}`}>{u.role}</span></td><td className="user-email">{u.email}</td><td><span className={`user-status ${u.status.toLowerCase()}`}>{u.status}</span></td><td><span className={u.verified?'verified-yes':'verified-no'} title={u.verified?'Verified':'Not verified'}>{u.verified?<I.CircleCheck/>:<I.CircleX/>}</span></td><td>{u.joined}</td><td>{u.login}</td><td><div className="user-actions"><button title="Edit user" onClick={()=>flash(`Editing ${u.name}`)}><I.Pencil/></button><button title="View user" onClick={()=>flash(`Viewing ${u.name}`)}><I.Eye/></button><button className="more" title="More actions"><I.EllipsisVertical/></button></div></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty"><I.SearchX/><b>No users found</b><span>Try changing the search or filters.</span></div>}</div>
      <div className="users-footer"><span>Showing 1 to {filtered.length} of 1,248 results</span><div><button aria-label="Previous"><I.ChevronLeft/></button><button className="active">1</button><button>2</button><button>3</button><span>...</span><button>125</button><button aria-label="Next"><I.ChevronRight/></button></div></div>
    </div>
    {modal&&<UserModal onClose={()=>setModal(false)} onSave={addUser}/>} {toast&&<div className="toast"><I.CircleCheck/>{toast}</div>}
  </div>
}
