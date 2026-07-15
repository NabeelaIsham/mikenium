import React from 'react';
import * as I from 'lucide-react';

export function Heading({title,action,onAction}){return <div className="users-heading system-heading"><div><h1>{title}</h1><div className="users-crumb">Dashboard<I.ChevronRight/><span>{title}</span></div></div>{action&&<button className="users-add" onClick={onAction}><I.Plus/>{action}</button>}</div>}
export function Stats({items}){return <div className={`system-stats cols-${items.length}`}>{items.map(([label,value,note,Icon,color])=><div className="card product-stat" key={label}><span className={`user-stat-icon ${color}`}><Icon/></span><div><small>{label}</small><b>{value}</b><p>{note}</p></div></div>)}</div>}
export function Toast({text}){return text?<div className="toast"><I.CircleCheck/>{text}</div>:null}
