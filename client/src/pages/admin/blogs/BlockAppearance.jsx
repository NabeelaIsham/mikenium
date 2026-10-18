import React from 'react';
import {BLOG_FONTS} from '../../../components/blog-presentation';

export default function BlockAppearance({value={},onChange}) {
  const set=(key,next)=>{const style={...value};if(next===undefined)delete style[key];else style[key]=next;onChange(style);};
  return <details className="block-appearance" open><summary>Typography & appearance</summary><p>Applies to this block. Leave blank to use the article defaults.</p>
    <div className="client-form-grid">
      <label className="wide">Font family<select value={value.fontFamily||'default'} onChange={e=>set('fontFamily',e.target.value)}><option value="default">Article default</option>{BLOG_FONTS.map(font=><option key={font}>{font}</option>)}</select></label>
      <label>Font size (px)<input type="number" min="12" max="80" placeholder="Default" value={value.fontSize??''} onChange={e=>set('fontSize',e.target.value===''?undefined:Number(e.target.value))}/></label>
      <label>Weight<select aria-label="Weight" value={value.fontWeight||''} onChange={e=>set('fontWeight',e.target.value||undefined)}><option value="">Default</option>{[['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extra bold']].map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>
      <label>Alignment<select value={value.align||''} onChange={e=>set('align',e.target.value||undefined)}><option value="">Default</option>{['left','center','right'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Line height<input type="number" min="1" max="2.5" step="0.1" placeholder="Default" value={value.lineHeight??''} onChange={e=>set('lineHeight',e.target.value===''?undefined:Number(e.target.value))}/></label>
      <label className="blog-check"><input type="checkbox" checked={value.italic||false} onChange={e=>set('italic',e.target.checked)}/>Italic</label>
      <label className="blog-check"><input type="checkbox" checked={value.underline||false} onChange={e=>set('underline',e.target.checked)}/>Underline</label>
      <label>Text color<input type="color" value={value.color||'#17334e'} onChange={e=>set('color',e.target.value)}/></label>
      <label>Background<input type="color" value={value.background||'#ffffff'} onChange={e=>set('background',e.target.value)}/></label>
      <label>Padding (px)<input type="number" min="0" max="64" placeholder="Default" value={value.padding??''} onChange={e=>set('padding',e.target.value===''?undefined:Number(e.target.value))}/></label>
      <label>Corner radius (px)<input type="number" min="0" max="40" placeholder="Default" value={value.radius??''} onChange={e=>set('radius',e.target.value===''?undefined:Number(e.target.value))}/></label>
    </div><button type="button" onClick={()=>onChange({})}>Reset appearance</button>
  </details>;
}
