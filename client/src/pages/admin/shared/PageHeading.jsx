import React from 'react';
import * as I from 'lucide-react';

export function PageHeading({name,description,icon:Icon}){return <div className="page-heading"><div><span><Icon/></span><div><h1>{name}</h1><p>{description}</p></div></div><div className="breadcrumbs">Dashboard <I.ChevronRight/> {name}</div></div>}
