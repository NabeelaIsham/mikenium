// Run after npm run build. Uses mocked HTTP storage and the real blog schema;
// it does not require or change a database.
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {schema} from '../server/utils/blog-schema.js';
import {securityPolicy} from '../server/config/security-policy.js';

const root=resolve('client/dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const csp=Object.entries(securityPolicy().directives).filter(([,value])=>value!==null).map(([key,value])=>`${key.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)} ${value.join(' ')}`).join('; ');
const server=createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',csp);
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,`.${pathname}`);
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.setHeader('Content-Type','text/html');res.end(await readFile(resolve(root,'index.html')));}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  page.setDefaultTimeout(10000);
  const errors=[];
  const violations=[];
  await page.exposeFunction('recordCsp',value=>violations.push(value));
  await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>window.recordCsp(event.effectiveDirective)));
  page.on('pageerror',error=>errors.push(error.message));
  let saved;
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let data={};
    if(path.endsWith('/super-admin/session'))data={user:{name:'Builder Tester',email:'test@example.com',role:'SUPER_ADMIN'}};
    else if(path==='/api/admin/dashboard')return route.fulfill({status:503,json:{message:'Dashboard outside this test'}});
    else if(path==='/api/admin/blogs'&&route.request().method()==='POST'){
      const parsed=schema.safeParse(route.request().postDataJSON());
      if(!parsed.success)return route.fulfill({status:400,json:{message:JSON.stringify(parsed.error.issues)}});
      saved={...parsed.data,id:'bdc55358-2bcb-49f9-b31b-89a0ca79a66e',views:0,publishedAt:new Date().toISOString()};
      data={blog:saved};
    }else if(path==='/api/admin/blogs')data={blogs:saved?[saved]:[],stats:{total:saved?1:0}};
    else if(path==='/api/blogs')data={blogs:saved?[saved]:[]};
    else if(path.startsWith('/api/blogs/'))data={blog:saved};
    await route.fulfill({json:data});
  });
  await page.goto(`${base}/admin`);
  await page.locator('.sidebar nav').getByRole('button',{name:'Blogs',exact:true}).click();
  await page.getByRole('button',{name:'Add New Blog'}).click();
  await page.getByLabel('Article title',{exact:true}).fill('Visual builder test article');
  await page.getByLabel('Hero excerpt').fill('An article used to check the visual blog builder and published content.');
  const builder=page.locator('.blog-builder');
  await builder.scrollIntoViewIfNeeded();
  await expect(page.locator('.builder-item')).toHaveCount(3);
  await page.locator('.builder-palette').getByRole('button',{name:'Heading',exact:true}).dragTo(page.locator('[data-gap="0"]'));
  await expect(page.locator('.builder-item')).toHaveCount(4);
  await expect(page.locator('.builder-item').first()).toContainText('Heading');
  const inspector=page.getByRole('complementary',{name:'Block settings'});
  await inspector.getByLabel('Heading',{exact:true}).fill('Designed heading');
  await inspector.getByLabel('Font family').selectOption('Georgia');
  await inspector.getByLabel('Font size (px)').fill('32');
  await inspector.getByLabel('Weight',{exact:true}).selectOption('700');
  await inspector.getByLabel('Italic',{exact:true}).check();
  await expect(page.locator('.builder-item.selected h2')).toHaveCSS('font-family',/Georgia/);
  await expect(page.locator('.builder-item.selected h2')).toHaveCSS('font-size','32px');
  // Reorder an existing block to the end using the same native drag events.
  const transfer=await page.evaluateHandle(()=>new DataTransfer());
  await page.getByRole('button',{name:'Drag block 1',exact:true}).dispatchEvent('dragstart',{dataTransfer:transfer});
  await page.locator('[data-gap="4"]').dispatchEvent('dragover',{dataTransfer:transfer});
  await page.locator('[data-gap="4"]').dispatchEvent('drop',{dataTransfer:transfer});
  await expect(page.locator('.builder-item').last()).toContainText('Designed heading');
  console.log('Palette drag, typography preview and reordering passed.');
  await page.locator('.builder-palette').getByRole('button',{name:'FAQ',exact:true}).click();
  await inspector.getByLabel('Question',{exact:true}).fill('Can I publish this?');
  await inspector.getByLabel('Answer',{exact:true}).fill('Yes, select Published and save the article.');
  await page.locator('.builder-palette').getByRole('button',{name:'Gallery',exact:true}).click();
  await inspector.getByLabel('Image URL',{exact:true}).fill('/assets/blog-showcase.jpg');
  await inspector.getByLabel('Alt text',{exact:true}).fill('Gallery image');
  await inspector.getByRole('button',{name:'Add image'}).click();
  await inspector.getByLabel('Image URL',{exact:true}).nth(1).fill('/assets/blog-showcase.jpg');
  await inspector.getByLabel('Alt text',{exact:true}).nth(1).fill('Second gallery image');
  await inspector.getByLabel('Columns',{exact:true}).selectOption('2');
  await page.locator('.builder-palette').getByRole('button',{name:'List',exact:true}).click();
  await inspector.getByLabel('Numbered list').check();
  await inspector.locator('textarea').fill('First\nSecond\nThird');
  await expect(page.locator('.builder-item.selected ol li')).toHaveCount(3);
  await page.locator('select[name="status"]').selectOption('PUBLISHED');
  await page.getByRole('button',{name:'Save article',exact:true}).click();
  await expect(page.locator('.blog-editor-modal')).toHaveCount(0);
  console.log('FAQ/gallery/list editing and save passed.');
  assert.equal(saved.status,'PUBLISHED');
  assert.deepEqual(saved.blocks.map(b=>b.type),['paragraph','heading','paragraph','heading','faq','gallery','list']);
  assert.equal(saved.blocks[3].style.fontFamily,'Georgia');
  assert.equal(saved.blocks[5].items.length,2);
  await page.reload();
  await page.locator('.sidebar nav').getByRole('button',{name:'Blogs',exact:true}).click();
  await page.locator('.user-actions button').first().click();
  await page.getByRole('button',{name:'Edit 4. Heading',exact:true}).click();
  await expect(inspector.getByLabel('Font family')).toHaveValue('Georgia');
  await expect(inspector.getByLabel('Font size (px)')).toHaveValue('32');
  await mkdir('tmp/blog-builder-check',{recursive:true});
  await page.locator('.blog-builder').scrollIntoViewIfNeeded();
  await page.screenshot({path:'tmp/blog-builder-check/desktop.png'});
  await page.locator('.app').evaluate(el=>el.classList.add('dark-theme'));
  await expect(page.locator('.builder-item.selected h2')).toHaveCSS('color','rgb(8, 21, 45)');
  await page.screenshot({path:'tmp/blog-builder-check/dark.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('.builder-palette').getByRole('button',{name:'Quote',exact:true}).click();
  await expect(page.locator('.builder-item')).toHaveCount(8);
  assert.equal(await page.locator('.blog-editor-modal').evaluate(el=>el.scrollWidth>el.clientWidth+2),false,'Mobile editor should not overflow');
  assert.ok(await page.locator('.blog-editor-modal').evaluate(el=>el.getBoundingClientRect().right<=innerWidth),'Mobile modal should fit the viewport');
  await page.screenshot({path:'tmp/blog-builder-check/mobile.png'});
  await page.goto(`${base}/blog/visual-builder-test-article`);
  await expect(page.getByRole('heading',{name:'Designed heading'})).toHaveCSS('font-family',/Georgia/);
  await expect(page.getByRole('heading',{name:'Designed heading'})).toHaveCSS('font-size','32px');
  await page.getByText('Can I publish this?',{exact:true}).click();
  await expect(page.getByText('Yes, select Published and save the article.')).toBeVisible();
  await expect(page.locator('.article-gallery img')).toHaveCount(2);
  await expect(page.locator('.article-numbered-list li')).toHaveCount(3);
  assert.deepEqual(errors,[],'No browser runtime errors');
  assert.deepEqual(violations,[],'No content security policy violations');
  console.log('Verified palette drag/drop, reordering, typography preview, FAQ/gallery/list editing, schema-validated publishing, reopening, mobile controls, and public rendering. HTTP storage was mocked.');
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
