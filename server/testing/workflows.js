import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';

export async function verifyWorkflows({base,cookie,pool}){
  const headers={Cookie:cookie,'Content-Type':'application/json',Origin:'http://localhost:5173','Sec-Fetch-Site':'same-origin','User-Agent':'mikenium-ci'};
  async function request(route,{method='GET',body,status=200,authenticated=true}={}){
    const response=await fetch(`${base}${route}`,{method,headers:authenticated?headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    const text=await response.text();assert.equal(response.status,status,`${method} ${route}: ${text}`);
    return text?JSON.parse(text):null;
  }
  for(const route of ['dashboard','users','clients','projects','services','products','pricing','blogs','testimonials','partners','contact-messages','settings','activity-logs','system-backups']){
    await request(`/api/admin/${route}`);
    await request(`/api/admin/${route}`,{authenticated:false,status:401});
  }
  const name=`Workflow ${randomUUID()}`,description='A sample record for verifying the complete publishing workflow.';
  const cases=[
    ['users','user',{name,email:`${randomUUID()}@example.test`,password:'Test-only-password-12345'},{name:`${name} updated`}],
    ['clients','client',{name,location:'Colombo',contact:'Test Contact',email:`${randomUUID()}@example.test`,industry:'Software'},{name:`${name} updated`}],
    ['services','service',{name,description,category:'Software',status:'DRAFT'},{status:'PUBLISHED'},'services'],
    ['projects','project',{name,description,category:'Software',published:false},{published:true},'projects'],
    ['products','product',{name,description,category:'Software',type:'Application',platform:'Web',status:'DRAFT'},{status:'PUBLISHED'},'products'],
    ['pricing','plan',{name,description,custom:true,status:'DRAFT'},{status:'PUBLISHED'},'plans'],
    ['blogs','blog',{title:name,excerpt:description,category:'Software',authorName:'Test Author',blocks:[{id:'paragraph',type:'paragraph',text:description}],status:'DRAFT'},{status:'PUBLISHED'},'blogs'],
    ['testimonials','testimonial',{clientName:name,company:'Test Company',text:description,service:'Software',rating:5,status:'PENDING'},{status:'PUBLISHED'},'testimonials'],
    ['partners','partner',{name,status:'DRAFT'},{status:'PUBLISHED'},'partners']
  ];
  for(const [route,key,body,patch,publicKey] of cases){
    const created=(await request(`/api/admin/${route}`,{method:'POST',body,status:201}))[key];
    assert.ok(created?.id,route);
    assert.equal((await request(`/api/admin/${route}/${created.id}`))[key].id,created.id);
    if(publicKey)assert.ok(!(await request(`/api/${route}`,{authenticated:false}))[publicKey].some(row=>row.id===created.id),`${route} hides unpublished records`);
    if(route==='pricing'){
      await request(`/api/admin/pricing/${created.id}`,{method:'PATCH',body:{custom:false},status:400});
      await request('/api/admin/pricing',{method:'POST',body:{name:`${name} invalid`,description,monthlyPrice:'',annualPrice:'',monthlyPriceLkr:null,annualPriceLkr:null,monthlyPriceAud:' ',annualPriceAud:' '},status:400});
    }
    if(route==='blogs')await request(`/api/admin/blogs/${created.id}`,{method:'PATCH',body:{status:'SCHEDULED'},status:400});
    const updated=(await request(`/api/admin/${route}/${created.id}`,{method:'PATCH',body:patch}))[key];
    for(const [field,value] of Object.entries(patch))assert.equal(updated[field],value,`${route}.${field}`);
    if(publicKey)assert.ok((await request(`/api/${route}`,{authenticated:false}))[publicKey].some(row=>row.id===created.id),`${route} publishes records`);
    if(route==='blogs')assert.equal((await fetch(`${base}/api/blogs/${created.slug}`)).status,200);
    await request(`/api/admin/${route}/${created.id}`,{method:'DELETE',status:204});
    await request(`/api/admin/${route}/${created.id}`,{status:404});
  }
  const publicSettings=(await request('/api/settings',{authenticated:false})).settings;
  assert.equal(publicSettings.security,undefined);assert.equal(publicSettings.email,undefined);
  const settings=(await request('/api/admin/settings')).settings;
  await request('/api/admin/settings/email',{method:'PATCH',body:{...settings.email,notifyContact:false}});
  const contactEmail=`${randomUUID()}@example.test`;
  await request('/api/contact',{method:'POST',authenticated:false,body:{name:'Workflow Contact',email:contactEmail,service:'Software',message:description},status:201});
  const message=(await request(`/api/admin/contact-messages?q=${contactEmail}`)).messages[0];assert.ok(message);
  await request(`/api/admin/contact-messages/${message.id}`,{method:'PATCH',body:{status:'READ'}});
  await request(`/api/admin/contact-messages/${message.id}/replies`,{method:'POST',body:{type:'INTERNAL_NOTE',body:'Follow up on the sample enquiry.'},status:201});
  assert.equal((await request(`/api/admin/contact-messages/${message.id}`)).message.replies.length,1);
  await request(`/api/admin/contact-messages/${message.id}`,{method:'DELETE',status:204});
  assert.equal((await pool.query('SELECT count(*)::int count FROM contact_message_replies WHERE message_id=$1',[message.id])).rows[0].count,0);
  await request('/api/admin/settings/email',{method:'PATCH',body:settings.email});

  // Exercise token state transitions without sending mail to an external inbox.
  const token='b'.repeat(64),unsubscribe='c'.repeat(64),hash=value=>createHash('sha256').update(value).digest('hex');
  const subscriber=(await pool.query("INSERT INTO newsletter_subscribers(email,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash) VALUES($1,'PENDING',$2,now()+interval '1 hour',$3) RETURNING id",[`${randomUUID()}@example.test`,hash(token),hash(unsubscribe)])).rows[0];
  assert.equal((await fetch(`${base}/api/newsletter/confirm?token=${token}`)).status,200);
  assert.equal((await pool.query('SELECT status FROM newsletter_subscribers WHERE id=$1',[subscriber.id])).rows[0].status,'PENDING');
  for(const [route,value,state] of [['confirm',token,'ACTIVE'],['unsubscribe',unsubscribe,'UNSUBSCRIBED']]){
    const response=await fetch(`${base}/api/newsletter/${route}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`token=${value}`});assert.equal(response.status,200);
    assert.equal((await pool.query('SELECT status FROM newsletter_subscribers WHERE id=$1',[subscriber.id])).rows[0].status,state);
  }
  await pool.query('DELETE FROM newsletter_subscribers WHERE id=$1',[subscriber.id]);
  const malformed=await fetch(`${base}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
  if(process.env.STATIC_DIR){
    const head=await fetch(base,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    for(const route of ['/','/about','/services','/portfolio','/products','/pricing','/blog','/contact','/privacy-policy','/terms-of-service','/cookie-policy','/admin'])assert.equal((await fetch(`${base}${route}`)).status,200,route);
    assert.equal((await fetch(`${base}/administrator-missing`)).status,404);
    await request('/api/admin/settings/seo',{method:'PATCH',body:{...settings.seo,allowIndexing:false}});
    assert.match(await (await fetch(base)).text(),/name="robots" content="noindex,nofollow"/);
    await request('/api/admin/settings/seo',{method:'PATCH',body:settings.seo});
    await request('/api/admin/settings/maintenance',{method:'PATCH',body:{...settings.maintenance,enabled:true}});
    const maintenance=await fetch(base);assert.equal(maintenance.status,503);assert.equal(maintenance.headers.get('retry-after'),'3600');
    assert.match(await maintenance.text(),/name="robots" content="noindex,nofollow"/);
    assert.equal((await fetch(`${base}/admin`)).status,200);
    await request('/api/admin/settings/maintenance',{method:'PATCH',body:settings.maintenance});
  }
  console.log('Verified admin CRUD, publication visibility, contact handling, newsletter tokens, settings privacy, and HTTP/SEO behavior.');
}
