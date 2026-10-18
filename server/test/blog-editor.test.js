import test from 'node:test';
import assert from 'node:assert/strict';
import {schema,updateSchema} from '../utils/blog-schema.js';
import {MAX_BLOG_BLOCKS,importArticleText,moveBlockToGap} from '../../client/src/pages/admin/blogs/blog-editor-utils.js';
import {blockPresentation} from '../../client/src/components/blog-presentation.js';

const article={title:'Example article',excerpt:'An example long enough to be an excerpt.',category:'Engineering',authorName:'Editor'};
const paragraphs=count=>Array.from({length:count},(_,i)=>({id:String(i),type:'paragraph',text:'Content'}));
test('drag reordering preserves content and handles both ends and adjacent gaps',()=>{
  const blocks=paragraphs(4);
  assert.deepEqual(moveBlockToGap(blocks,'0',4).map(b=>b.id),['1','2','3','0']);
  assert.deepEqual(moveBlockToGap(blocks,'3',0).map(b=>b.id),['3','0','1','2']);
  assert.deepEqual(moveBlockToGap(blocks,'1',2),blocks);
  assert.deepEqual(moveBlockToGap(blocks,'1',1),blocks);
  assert.deepEqual(moveBlockToGap(blocks,'missing',2),blocks);
  assert.deepEqual(blocks,paragraphs(4));
});
test('FAQ, galleries and typography survive create and edit validation',()=>{
  const style={fontFamily:'Georgia',fontSize:28,fontWeight:'700',italic:true,underline:true,align:'center',lineHeight:1.5,color:'#123456',background:'#ffffff',padding:16,radius:12};
  const blocks=[{id:'faq',type:'faq',title:'FAQ',style,items:[{question:'How?',answer:'Like this.'}]},{id:'gallery',type:'gallery',title:'Photos',columns:2,items:[{id:'image',url:'/uploads/blogs/photo.png',alt:'Photo',caption:'Example'}]}];
  assert.deepEqual(schema.parse({...article,blocks}).blocks,blocks);
  assert.deepEqual(updateSchema.parse({blocks}).blocks,blocks);
  assert.equal(blockPresentation(style).style['--blog-font'],'"Georgia", serif');
  assert.equal(blockPresentation(style).style['--blog-color'],'#123456');
});
test('invalid styles, empty FAQs and unsafe gallery URLs are rejected',()=>{
  for(const style of [{fontFamily:'Unknown font'},{fontSize:200},{color:'red;display:none'},{lineHeight:0},{padding:-1}]){
    assert.equal(updateSchema.safeParse({blocks:[{...paragraphs(1)[0],style}]}).success,false);
  }
  assert.equal(updateSchema.safeParse({blocks:[{id:'faq',type:'faq',items:[]}]}).success,false);
  for(const url of ['','javascript:alert(1)']) assert.equal(updateSchema.safeParse({blocks:[{id:'gallery',type:'gallery',items:[{id:'one',url}]}]}).success,false);
  assert.deepEqual(blockPresentation({fontFamily:'url(evil)',color:'red;',fontSize:200}),{style:{}});
});
test('create and update accept long articles and enforce the editor limit',()=>{
  for(const count of [61,MAX_BLOG_BLOCKS]){
    assert.equal(schema.safeParse({...article,blocks:paragraphs(count)}).success,true);
    assert.equal(updateSchema.safeParse({blocks:paragraphs(count)}).success,true);
  }
  assert.equal(schema.safeParse({...article,blocks:paragraphs(MAX_BLOG_BLOCKS+1)}).success,false);
  assert.equal(updateSchema.safeParse({blocks:paragraphs(MAX_BLOG_BLOCKS+1)}).success,false);
});
test('heading levels persist, old headings default to H2, and invalid levels fail',()=>{
  const heading={id:'heading',type:'heading',title:'Section'};
  assert.equal(updateSchema.parse({blocks:[heading]}).blocks[0].level,2);
  for(const level of [2,3,4,5,6]) assert.equal(updateSchema.parse({blocks:[{...heading,level}]}).blocks[0].level,level);
  for(const level of [1,7,'3']) assert.equal(updateSchema.safeParse({blocks:[{...heading,level}]}).success,false);
});
test('text import groups paragraphs and bullets and creates valid heading levels',()=>{
  let id=0;
  const blocks=importArticleText('# Section\r\nFirst line\r\nSecond line\r\n\r\n### Subheading\r\n- One\r\n- Two\r\n\r\nLast paragraph',()=>String(++id));
  assert.deepEqual(blocks.map(b=>b.type),['heading','paragraph','heading','list','paragraph']);
  assert.equal(blocks[0].level,2);
  assert.equal(blocks[2].level,3);
  assert.equal(blocks[1].text,'First line\nSecond line');
  assert.deepEqual(blocks[3].items,['One','Two']);
  assert.equal(schema.safeParse({...article,blocks}).success,true);
  assert.deepEqual(importArticleText(' \n',()=>''),[]);
});
