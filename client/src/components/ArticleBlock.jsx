import React from 'react';
import * as I from 'lucide-react';
import {blockPresentation} from './blog-presentation';
import '../styles/blog-blocks.css';

function BlockContent({block,index}){
  if(block.type==='heading'){const Heading=`h${[2,3,4,5,6].includes(block.level)?block.level:2}`;return <section id={block.id} className="article-section reveal"><span className="section-count">{String(index+1).padStart(2,'0')}</span><div><span className="article-kicker">{block.eyebrow}</span><Heading>{block.title}</Heading></div></section>;}
  if(block.type==='paragraph')return <div className={`article-content-block reveal ${block.lead?'lead-block':''}`}><p>{block.text}</p></div>;
  if(block.type==='quote')return <div className="article-content-block reveal"><blockquote><I.Quote/><p>{block.text}</p>{block.cite&&<cite>— {block.cite}</cite>}</blockquote></div>;
  if(block.type==='faq')return <div className="article-content-block article-faq reveal">{block.title&&<h3>{block.title}</h3>}{block.items.map((item,i)=><details key={i}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>;
  if(block.type==='gallery')return <div className="article-content-block reveal">{block.title&&<h3>{block.title}</h3>}<div className={`article-gallery columns-${block.columns||3}`}>{block.items.map(item=><figure key={item.id}>{item.url?<img src={item.url} alt={item.alt} loading="lazy" decoding="async"/>:<div className="gallery-placeholder">Add an image</div>}{item.caption&&<figcaption>{item.caption}</figcaption>}</figure>)}</div></div>;
  if(block.type==='list'&&block.ordered)return <div className="article-content-block reveal">{block.title&&<h3>{block.title}</h3>}<ol className="article-numbered-list">{block.items.map((item,i)=><li key={i}>{item}</li>)}</ol></div>;
  if(block.type==='list')return <div className="article-content-block reveal">{block.title&&<h3>{block.title}</h3>}<ul className="prepare-list">{block.items.map((item,i)=><li key={i}><I.CircleCheck/><span>{item}</span></li>)}</ul></div>;
  if(block.type==='image')return <figure className="article-inline-image reveal"><img src={block.url} loading="lazy" decoding="async" alt={block.alt}/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
  if(block.type==='featureGrid')return <div className="article-content-block reveal">{block.title&&<h3>{block.title}</h3>}<div className="technology-grid">{block.items.map((item,i)=><article key={`${item.title}-${i}`}><span><I.Sparkles/></span><small>0{i+1}</small><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div>;
  if(block.type==='callout')return <div className="article-content-block reveal"><div className="article-cta"><span><I.Send/></span><div><small>{block.eyebrow}</small><h3>{block.title}</h3><p>{block.text}</p></div><a className="site-button" href={block.buttonUrl}>{block.buttonLabel}<I.ArrowRight/></a></div></div>;
  return null;
}

export default function ArticleBlock({block,index,preview=false}){
  return <div className="blog-styled-block" {...blockPresentation(block.style)}><BlockContent block={preview?{...block,id:`preview-${block.id}`}:block} index={index}/></div>;
}
