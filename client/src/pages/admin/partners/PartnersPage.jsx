import React,{useEffect,useMemo,useState} from 'react';
import * as I from 'lucide-react';
import {createPartner,deletePartner,getPartners,updatePartner,uploadPartnerLogo} from '../../../services/admin/admin-api';

const labels={PUBLISHED:'Published',DRAFT:'Draft',INACTIVE:'Inactive'};
const icons={building:I.Building2,layers:I.Layers3,cloud:I.Cloud,data:I.CircleDotDashed,network:I.Network,hexagon:I.Hexagon,badge:I.Badge,globe:I.Globe2,briefcase:I.BriefcaseBusiness,handshake:I.Handshake};
const blank={name:'',descriptor:'',websiteUrl:'',logoUrl:'',icon:'building',status:'PUBLISHED',order:0};
const date=value=>new Date(value).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'});

function PartnerModal({partner,onClose,onSave,saving,error}){
  const [form,setForm]=useState(partner||blank),[uploading,setUploading]=useState(false),[uploadError,setUploadError]=useState('');
  const change=event=>setForm(current=>({...current,[event.target.name]:event.target.value}));
  const upload=async file=>{
    if(file.size>3*1024*1024){setUploadError('Partner logo must be 3 MB or smaller');return}
    setUploading(true);setUploadError('');
    try{const data=await uploadPartnerLogo(file);setForm(current=>({...current,logoUrl:data.logoUrl}))}
    catch(uploadFailure){setUploadError(uploadFailure.message)}
    finally{setUploading(false)}
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal partner-modal" onMouseDown={event=>event.stopPropagation()} onSubmit={event=>{event.preventDefault();onSave({...form,order:Number(form.order)})}}><div className="modal-head"><div><h2>{partner?'Edit Partner':'Add New Partner'}</h2><p>Published partners appear automatically in the homepage partner marquee.</p></div><button type="button" onClick={onClose}><I.X/></button></div>{error&&<div className="blog-editor-error"><I.CircleAlert/><span>{error}</span></div>}<div className="client-form-grid">
    <label>Partner name<input required autoFocus name="name" value={form.name} onChange={change} placeholder="e.g. TechWave"/></label>
    <label>Descriptor<input name="descriptor" value={form.descriptor} onChange={change} placeholder="SOLUTIONS"/></label>
    <label className="wide">Website URL<input type="url" name="websiteUrl" value={form.websiteUrl} onChange={change} placeholder="https://partner.example.com"/></label>
    <label>Fallback icon<select name="icon" value={form.icon} onChange={change}>{Object.keys(icons).map(value=><option value={value} key={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}</select></label>
    <label>Status<select name="status" value={form.status} onChange={change}>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
    <label>Display order<input type="number" min="0" max="999" name="order" value={form.order} onChange={change}/></label>
    <label className="wide">Logo URL<input name="logoUrl" value={form.logoUrl} onChange={change} placeholder="Upload a logo or enter its URL"/></label>
    <label className="wide project-image-upload"><span>Upload partner logo</span><input id="partner-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>event.target.files[0]&&upload(event.target.files[0])}/><label className="project-upload-box partner-upload-box" htmlFor="partner-logo">{form.logoUrl?<img src={form.logoUrl} alt="Partner logo preview"/>:<><I.UploadCloud/><b>{uploading?'Uploading...':'Choose partner logo'}</b><small>JPG, PNG or WebP · max 3 MB</small></>}</label>{uploadError&&<em>{uploadError}</em>}</label>
  </div><div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={saving||uploading}>{saving?<I.LoaderCircle className="spin"/>:<I.Save/>}{saving?'Saving...':'Save partner'}</button></div></form></div>;
}

export function PartnersPage(){
  const [partners,setPartners]=useState([]),[stats,setStats]=useState({}),[query,setQuery]=useState(''),[status,setStatus]=useState('ALL'),[modal,setModal]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
  const load=async()=>{setLoading(true);setError('');try{const data=await getPartners();setPartners(data.partners);setStats(data.stats)}catch(loadError){setError(loadError.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>partners.filter(item=>`${item.name} ${item.descriptor} ${item.websiteUrl}`.toLowerCase().includes(query.toLowerCase())&&(status==='ALL'||item.status===status)),[partners,query,status]);
  const flash=message=>{setToast(message);setTimeout(()=>setToast(''),2500)};
  const save=async form=>{setSaving(true);setError('');try{modal?.id?await updatePartner(modal.id,form):await createPartner(form);setModal(null);await load();flash('Partner saved successfully')}catch(saveError){setError(saveError.message)}finally{setSaving(false)}};
  const remove=async item=>{if(!confirm(`Delete ${item.name}? It will disappear from the homepage.`))return;try{await deletePartner(item.id);await load();flash('Partner deleted')}catch(deleteError){setError(deleteError.message)}};
  const cards=[['Total Partners',stats.total,I.Handshake,'blue'],['Published',stats.published,I.SquareCheckBig,'green'],['Draft',stats.draft,I.Clock3,'orange'],['Inactive',stats.inactive,I.CirclePause,'purple']];
  return <div className="users-page partners-page"><div className="users-heading"><div><h1>Partners</h1><div className="users-crumb">Dashboard <I.ChevronRight/> <span>Partners</span></div></div><button className="users-add" onClick={()=>{setError('');setModal({})}}><I.Plus/> Add New Partner</button></div><div className="user-stats">{cards.map(([title,value,Icon,color])=><div className="card user-stat" key={title}><span className={`user-stat-icon ${color}`}><Icon/></span><div><small>{title}</small><b>{Number(value||0).toLocaleString()}</b><p>Live database total</p></div></div>)}</div>
    {error&&!modal&&<div className="admin-inline-error"><I.CircleAlert/>{error}<button onClick={()=>setError('')}><I.X/></button></div>}<div className="card users-table-card"><div className="users-toolbar"><div className="users-search partner-search"><I.Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search partners..."/></div><select value={status} onChange={event=>setStatus(event.target.value)}><option value="ALL">All Status</option>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><div className="toolbar-spacer"/><button onClick={load} disabled={loading}>{loading?<I.LoaderCircle className="spin"/>:<I.RefreshCw/>} Refresh</button></div>
      <div className="users-table-wrap"><table className="users-table partners-table"><thead><tr><th>Partner</th><th>Website</th><th>Status</th><th>Order</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map(item=>{const Icon=icons[item.icon]||I.Building2;return <tr key={item.id}><td><div className="partner-identity">{item.logoUrl?<img src={item.logoUrl} alt=""/>:<i><Icon/></i>}<span><b>{item.name}</b><small>{item.descriptor||'No descriptor'}</small></span></div></td><td>{item.websiteUrl?<a className="partner-url" href={item.websiteUrl} target="_blank" rel="noreferrer">{item.websiteUrl}<I.ExternalLink/></a>:'—'}</td><td><span className={`partner-status ${item.status.toLowerCase()}`}>{labels[item.status]}</span></td><td>{item.order}</td><td>{date(item.updatedAt)}</td><td><div className="user-actions"><button className="edit-user" onClick={()=>{setError('');setModal(item)}}><I.Pencil/><span>Edit</span></button><button className="danger" onClick={()=>remove(item)}><I.Trash2/></button></div></td></tr>})}</tbody></table>{loading?<div className="empty"><I.LoaderCircle className="spin"/><b>Loading partners...</b></div>:!filtered.length&&<div className="empty"><I.SearchX/><b>No partners found</b><span>Add a partner to display it on the homepage.</span></div>}</div><div className="users-footer"><span>Showing {filtered.length} of {Number(stats.total||0)} database partners</span></div></div>
    {modal&&<PartnerModal partner={modal.id?modal:null} onClose={()=>setModal(null)} onSave={save} saving={saving} error={error}/>} {toast&&<div className="toast"><I.CircleCheck/>{toast}</div>}</div>;
}
