import React,{useEffect,useMemo,useState} from 'react';
import * as I from 'lucide-react';
import {getContactMessage,getContactMessages,replyToContactMessage,updateContactMessage} from '../../../services/admin/admin-api';

const tones=['blue','purple','orange','green','red','yellow','cyan'];
const labels={NEW:'New',READ:'Read',REPLIED:'Replied',CLOSED:'Closed',TRASH:'Trash'};
const dateParts=value=>{
  const date=new Date(value);
  return {
    date:date.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}),
    time:date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
  };
};
const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();

export function ContactMessagesPage(){
  const [messages,setMessages]=useState([]);
  const [stats,setStats]=useState({total:0,new:0,read:0,replied:0,closed:0,trash:0});
  const [channels,setChannels]=useState([]);
  const [activeId,setActiveId]=useState('');
  const [active,setActive]=useState(null);
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('ALL');
  const [channel,setChannel]=useState('ALL');
  const [selected,setSelected]=useState([]);
  const [reply,setReply]=useState('');
  const [tab,setTab]=useState('REPLY');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [toast,setToast]=useState('');

  const flash=message=>{setToast(message);window.setTimeout(()=>setToast(''),2500)};
  const load=async(preferredId='')=>{
    setLoading(true);setError('');
    try{
      const data=await getContactMessages();
      setMessages(data.messages);setStats(data.stats);setChannels(data.channels);
      const nextId=preferredId||activeId||data.messages[0]?.id||'';
      setActiveId(nextId);
      if(nextId){
        const detail=await getContactMessage(nextId);
        setActive(detail.message);
      }else setActive(null);
    }catch(loadError){setError(loadError.message)}
    finally{setLoading(false)}
  };
  useEffect(()=>{load()},[]);

  const filtered=useMemo(()=>messages.filter(message=>{
    const matchesText=[message.sender,message.email,message.company,message.subject,message.message].join(' ').toLowerCase().includes(query.toLowerCase());
    return matchesText&&(status==='ALL'||message.status===status)&&(channel==='ALL'||message.channel===channel);
  }),[messages,query,status,channel]);

  const openMessage=async message=>{
    setActiveId(message.id);setError('');
    try{
      if(message.status==='NEW'){
        await updateContactMessage(message.id,'READ');
        setMessages(current=>current.map(item=>item.id===message.id?{...item,status:'READ'}:item));
        setStats(current=>({...current,new:Math.max(0,Number(current.new)-1),read:Number(current.read)+1}));
      }
      setActive((await getContactMessage(message.id)).message);
    }catch(openError){setError(openError.message)}
  };
  const toggle=id=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
  const toggleAll=()=>setSelected(current=>filtered.length&&filtered.every(message=>current.includes(message.id))?current.filter(id=>!filtered.some(message=>message.id===id)):[...new Set([...current,...filtered.map(message=>message.id)])]);
  const changeStatus=async nextStatus=>{
    if(!active)return;
    setSaving(true);setError('');
    try{await updateContactMessage(active.id,nextStatus);await load(active.id);flash(`Message marked as ${labels[nextStatus].toLowerCase()}`)}
    catch(saveError){setError(saveError.message)}
    finally{setSaving(false)}
  };
  const sendReply=async()=>{
    if(!active||!reply.trim()){flash(tab==='REPLY'?'Write a reply first':'Write a note first');return}
    setSaving(true);setError('');
    try{
      await replyToContactMessage(active.id,reply,tab);
      setReply('');await load(active.id);
      flash(tab==='REPLY'?'Reply emailed successfully':'Internal note saved');
    }catch(sendError){setError(sendError.message);await load(active.id)}
    finally{setSaving(false)}
  };
  const statCards=[
    ['Total Messages',stats.total,I.Mail,'blue'],
    ['New Messages',stats.new,I.MessageSquare,'green'],
    ['Replied',stats.replied,I.MailCheck,'orange'],
    ['Trash',stats.trash,I.Trash2,'pink']
  ];

  return <div className="users-page contact-messages-page">
    <div className="users-heading contact-heading"><div><h1>Contact Messages</h1><div className="users-crumb">Dashboard <I.ChevronRight/> <span>Contact Messages</span></div></div><button className="users-add" onClick={()=>load(activeId)} disabled={loading}><I.RefreshCw className={loading?'spin':''}/> Refresh</button></div>
    {error&&<div className="admin-inline-error"><I.CircleAlert/><span>{error}</span><button onClick={()=>setError('')}><I.X/></button></div>}
    <div className="contact-layout"><div className="contact-left"><div className="contact-stats">{statCards.map(([title,value,Icon,color])=><div className="card user-stat" key={title}><span className={`user-stat-icon ${color}`}><Icon/></span><div><small>{title}</small><b>{Number(value||0).toLocaleString()}</b><p><span>Live database total</span></p></div></div>)}</div>
      <div className="card contact-inbox"><div className="contact-toolbar"><div className="users-search"><I.Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search messages..."/></div><select value={status} onChange={event=>setStatus(event.target.value)}><option value="ALL">All Status</option>{Object.entries(labels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><select value={channel} onChange={event=>setChannel(event.target.value)}><option value="ALL">All Channels</option>{channels.map(value=><option value={value} key={value}>{value}</option>)}</select><div className="toolbar-spacer"/><button onClick={()=>{setQuery('');setStatus('ALL');setChannel('ALL')}}><I.ListFilter/> Clear Filters</button></div>
        <div className="contact-table-wrap"><table className="users-table contact-table"><thead><tr><th><input type="checkbox" checked={filtered.length>0&&filtered.every(message=>selected.includes(message.id))} onChange={toggleAll}/></th><th>Sender</th><th>Subject</th><th>Status</th><th>Received On <I.RotateCw/></th></tr></thead><tbody>{filtered.map((message,index)=>{const received=dateParts(message.createdAt);return <tr key={message.id} className={message.id===activeId?'selected':''} onClick={()=>openMessage(message)}><td><input type="checkbox" checked={selected.includes(message.id)} onClick={event=>event.stopPropagation()} onChange={()=>toggle(message.id)}/></td><td><div className="message-sender"><i className={tones[index%tones.length]}>{initials(message.sender)}</i><span><b>{message.sender}</b><small>{message.email}</small></span></div></td><td><span className="message-subject"><b>{message.subject}</b><small>{message.message}</small></span></td><td><span className={`message-status ${message.status.toLowerCase()}`}>{labels[message.status]}</span></td><td><span className="created-date">{received.date}<small>{received.time}</small></span></td></tr>})}</tbody></table>{!loading&&!filtered.length&&<div className="empty"><I.MailOpen/><b>No enquiries found</b><span>Website enquiries will appear here as soon as they are submitted.</span></div>}{loading&&<div className="empty"><I.LoaderCircle className="spin"/><b>Loading enquiries...</b></div>}</div>
        <div className="users-footer"><span>Showing {filtered.length} of {messages.length} messages</span></div></div></div>
      {active&&<MessageDetail active={active} saving={saving} reply={reply} setReply={setReply} tab={tab} setTab={setTab} changeStatus={changeStatus} sendReply={sendReply}/>}
    </div>{toast&&<div className="toast"><I.CircleCheck/>{toast}</div>}
  </div>;
}

function MessageDetail({active,saving,reply,setReply,tab,setTab,changeStatus,sendReply}){
  const received=dateParts(active.createdAt);
  return <aside className="card message-detail"><div className="message-detail-head"><h2>{active.subject}</h2><span className={`message-status ${active.status.toLowerCase()}`}>{labels[active.status]}</span><div><button title="Close enquiry" disabled={saving} onClick={()=>changeStatus('CLOSED')}><I.CircleCheck/></button><button title="Move to trash" disabled={saving} onClick={()=>changeStatus('TRASH')}><I.Trash2/></button></div></div>
    <div className="message-profile"><div className="message-person"><i className="blue">{initials(active.sender)}</i><span><b>{active.sender}</b><small>{active.email}</small>{active.phone&&<small>{active.phone}</small>}{active.company&&<small>{active.company}</small>}</span></div><dl><div><dt>Received On</dt><dd>{received.date} {received.time}</dd></div><div><dt>Channel</dt><dd>{active.channel}</dd></div><div><dt>IP Address</dt><dd>{active.ip||'Unavailable'}</dd></div></dl></div>
    <div className="message-enquiry-meta"><span><b>Requested service</b>{active.service||'General enquiry'}</span><span><b>Notification email</b>{active.notificationStatus==='SENT'?'Delivered':active.notificationStatus==='FAILED'?'Failed':'Pending'}</span></div>
    <div className="message-body">{active.message.split(/\r?\n/).map((paragraph,index)=><p key={index}>{paragraph||'\u00a0'}</p>)}</div>
    <div className="previous-conversation"><h3>Conversation history ({active.replies.length}) <I.ChevronDown/></h3>{active.replies.length?active.replies.map(item=><div key={item.id}><span className="mini-admin">SA</span><p><b>{item.type==='INTERNAL_NOTE'?'Internal Note':item.createdBy}</b><small>{new Date(item.createdAt).toLocaleString()}</small><em>{item.type==='INTERNAL_NOTE'?'Private':item.emailStatus==='SENT'?'Sent':item.emailStatus}</em><span>{item.body}</span></p></div>):<div className="message-no-replies">No replies or internal notes yet.</div>}</div>
    <div className="reply-tabs"><button className={tab==='REPLY'?'active':''} onClick={()=>setTab('REPLY')}>Reply by Email</button><button className={tab==='INTERNAL_NOTE'?'active':''} onClick={()=>setTab('INTERNAL_NOTE')}>Internal Note</button></div><div className="reply-editor"><div>{tab==='REPLY'?<><I.Mail/> Reply will be emailed to {active.email}</>:<><I.LockKeyhole/> Only Super Admin can see this note</>}</div><textarea value={reply} onChange={event=>setReply(event.target.value)} placeholder={tab==='REPLY'?'Type your email reply...':'Add a private internal note...'}/></div><div className="reply-actions"><span/><button disabled={saving} onClick={sendReply}>{saving?<I.LoaderCircle className="spin"/>:<I.Send/>} {tab==='REPLY'?'Send Reply':'Save Note'}</button></div>
  </aside>;
}
