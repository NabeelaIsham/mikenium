import React from 'react';

export default function CollectionFields({block,change,upload,uploading}) {
  const gallery=block.type==='gallery';
  const max=gallery?12:30;
  const update=(index,key,value)=>change({...block,items:block.items.map((item,i)=>i===index?{...item,[key]:value}:item)});
  const add=()=>change({...block,items:[...block.items,gallery?{id:globalThis.crypto.randomUUID(),url:'',alt:'',caption:''}:{question:'New question?',answer:'Write your answer here.'}]});
  return <div className="collection-fields">
    <label>{gallery?'Gallery':'FAQ'} title<input value={block.title} maxLength="200" onChange={e=>change({...block,title:e.target.value})}/></label>
    {gallery&&<label>Columns<select aria-label="Columns" value={block.columns||3} onChange={e=>change({...block,columns:Number(e.target.value)})}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>}
    {block.items.map((item,index)=><div className="collection-item" key={item.id||index}><div className="collection-item-head"><b>{gallery?'Image':'Question'} {index+1}</b><button type="button" disabled={block.items.length<=1} onClick={()=>change({...block,items:block.items.filter((_,i)=>i!==index)})}>Remove</button></div>
      {gallery?<>
        <label>Image URL<input required value={item.url} onChange={e=>update(index,'url',e.target.value)} placeholder="/uploads/blogs/... or https://..."/></label>
        <label>Upload image<input type="file" disabled={Boolean(uploading)} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>{if(e.target.files[0])upload(e.target.files[0],item.id);e.target.value='';}}/></label>
        <label>Alt text<input value={item.alt} maxLength="240" onChange={e=>update(index,'alt',e.target.value)}/></label>
        <label>Caption<input value={item.caption} maxLength="300" onChange={e=>update(index,'caption',e.target.value)}/></label>
      </>:<>
        <label>Question<input required value={item.question} maxLength="300" onChange={e=>update(index,'question',e.target.value)}/></label>
        <label>Answer<textarea aria-label="Answer" required value={item.answer} maxLength="4000" onChange={e=>update(index,'answer',e.target.value)}/></label>
      </>}
    </div>)}
    {uploading&&<p role="status">Uploading image...</p>}
    <button type="button" disabled={block.items.length>=max} onClick={add}>Add {gallery?'image':'question'} ({block.items.length}/{max})</button>
  </div>;
}
