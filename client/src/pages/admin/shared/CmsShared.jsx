import React from 'react';
import * as I from 'lucide-react';

export function Heading({title,action,icon:Ico=I.Plus,onAction}){return <div className="users-heading cms-heading"><div><h1>{title}</h1><div className="users-crumb">Dashboard <I.ChevronRight/><span>{title}</span></div></div><button className="users-add" onClick={onAction}><Ico/>{action}</button></div>}
export function Stats({items}){return <div className={`cms-stats count-${items.length}`}>{items.map(([label,value,note,Icon,color])=><div className="card product-stat" key={label}><span className={`user-stat-icon ${color}`}><Icon/></span><div><small>{label}</small><b>{value}</b><p>{note}</p></div></div>)}</div>}
export function Toast({text}){return text?<div className="toast"><I.CircleCheck/>{text}</div>:null}
