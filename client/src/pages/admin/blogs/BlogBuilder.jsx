import React,{useRef,useState} from 'react';
import * as I from 'lucide-react';
import ArticleBlock from '../../../components/ArticleBlock';
import {MAX_BLOG_BLOCKS,moveBlockToGap} from './blog-editor-utils';
import '../../../styles/single-blog-page.css';
import './blog-builder.css';

const elements = [
  ['heading','Heading',I.Heading],['paragraph','Paragraph',I.AlignLeft],
  ['image','Image',I.Image],['list','List',I.List],['faq','FAQ',I.MessageCircleQuestion],
  ['quote','Quote',I.Quote],['featureGrid','Features',I.LayoutGrid],
  ['callout','Call to action',I.MousePointerClick],['gallery','Gallery',I.Images]
];
const dragType='application/x-mikenium-blog';

export default function BlogBuilder({blocks,onChange,make,renderEditor}) {
  const [selectedId,setSelectedId]=useState(blocks[0]?.id);
  const [dragging,setDragging]=useState(false);
  const [over,setOver]=useState(null);
  const [mobile,setMobile]=useState(false);
  const [notice,setNotice]=useState('');
  const inspector=useRef(null);
  const index=blocks.findIndex(b=>b.id===selectedId);
  const selected=blocks[index];
  const atLimit=blocks.length>=MAX_BLOG_BLOCKS;
  const select=id=>{setSelectedId(id);setNotice('Block selected. Edit its content and appearance in Block settings.');};
  const add=(type,gap=selected?index+1:blocks.length)=>{
    if(atLimit||!Object.hasOwn(make,type))return;
    const block=make[type]();
    onChange([...blocks.slice(0,gap),block,...blocks.slice(gap)]);
    select(block.id);
    setNotice(`${elements.find(e=>e[0]===type)?.[1]} added.`);
  };
  const startDrag=(event,payload)=>{
    event.dataTransfer.setData(dragType,JSON.stringify(payload));
    event.dataTransfer.effectAllowed=payload.id?'move':'copy';
    setDragging(true);
  };
  const endDrag=()=>{setDragging(false);setOver(null);};
  const drop=(event,gap)=>{
    event.preventDefault();
    try {
      const payload=JSON.parse(event.dataTransfer.getData(dragType));
      if(payload.id){onChange(moveBlockToGap(blocks,payload.id,gap));select(payload.id);setNotice('Block moved.');}
      else if(payload.type)add(payload.type,gap);
    } catch { /* Ignore files or unrelated drag data. */ }
    endDrag();
  };
  const gap=position=><div key={`gap-${position}`} className={`builder-drop ${over===position?'over':''}`} data-gap={position}
    onDragOver={event=>{if(event.dataTransfer.types.includes(dragType)){event.preventDefault();setOver(position);}}}
    onDrop={event=>drop(event,position)}>{dragging?'Drop here':position===blocks.length?'Drop an element here':''}</div>;
  const remove=()=>{onChange(blocks.filter(b=>b.id!==selectedId));setSelectedId(blocks[index+1]?.id||blocks[index-1]?.id);setNotice('Block removed.');};
  const move=direction=>{onChange(moveBlockToGap(blocks,selectedId,direction<0?index-1:index+2));setNotice('Block moved.');};
  return <div className={`blog-builder ${dragging?'is-dragging':''}`}>
    <aside className="builder-palette" aria-label="Article elements">
      <h4>Elements</h4><p>Drag onto the canvas, or click to add after the selected block.</p>
      {elements.map(([type,label,Icon])=><button type="button" key={type} disabled={atLimit} draggable={!atLimit}
        onDragStart={event=>startDrag(event,{type})} onDragEnd={endDrag} onClick={()=>add(type)}><Icon/>{label}<I.GripVertical/></button>)}
    </aside>
    <div className="builder-workspace">
      <div className="builder-canvas-bar"><b>Article canvas</b><div><button type="button" onClick={()=>inspector.current?.scrollIntoView({block:'start',behavior:'smooth'})}><I.Settings2/>Block settings</button><button type="button" aria-pressed={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<I.Monitor/>:<I.Smartphone/>}{mobile?'Desktop width':'Mobile width'}</button></div></div>
      <p className="builder-notice" role="status">{notice||'Select a block to edit it. Drag its handle to reorder.'}</p>
      <div className={`builder-canvas ${mobile?'mobile-width':''}`}>
        {blocks.length===0&&<p className="builder-empty">Start your article by adding an element from the palette.</p>}
        {blocks.map((block,i)=><React.Fragment key={block.id}>{gap(i)}<div className={`builder-item ${selectedId===block.id?'selected':''}`} data-block-id={block.id}>
          <div className="builder-item-bar"><button type="button" draggable aria-label={`Drag block ${i+1}`} title="Drag to reorder" onDragStart={event=>startDrag(event,{id:block.id})} onDragEnd={endDrag}><I.GripVertical/></button><button type="button" aria-pressed={selectedId===block.id} onClick={()=>select(block.id)}>Edit {i+1}. {elements.find(e=>e[0]===block.type)?.[1]||block.type}</button></div>
          <div className="single-blog-page builder-preview" onClick={event=>{if(event.target.closest('a'))event.preventDefault();select(block.id);}}><div className="article-body"><ArticleBlock block={block} index={i} preview/></div></div>
        </div></React.Fragment>)}
        {gap(blocks.length)}
      </div>
    </div>
    <aside ref={inspector} className="builder-inspector" aria-label="Block settings"><h4>Block settings</h4>
      {selected?renderEditor({block:selected,index,count:blocks.length,atLimit,
        change:value=>onChange(blocks.map(b=>b.id===selectedId?value:b)),move,remove,
        duplicate:()=>{if(atLimit)return;const copy={...structuredClone(selected),id:globalThis.crypto.randomUUID()};onChange([...blocks.slice(0,index+1),copy,...blocks.slice(index+1)]);select(copy.id);},
        insert:type=>add(type,index+1)
      }):<p>Select a block on the canvas to edit its content, typography, and appearance.</p>}
    </aside>
  </div>;
}
