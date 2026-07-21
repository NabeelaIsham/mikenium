const API_URL=(import.meta.env.VITE_API_URL||(import.meta.env.DEV?'http://localhost:5000':'')).replace(/\/$/,'');
export async function getPublicProjects(){
  const response=await fetch(`${API_URL}/api/projects`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load projects');
  return data.projects||[];
}
export async function getPublicServices(){
  const response=await fetch(`${API_URL}/api/services`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load services');
  return data.services||[];
}
export async function getPublicProducts(){
  const response=await fetch(`${API_URL}/api/products`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load products');
  return data.products||[];
}
export async function getPublicPricing(){
  const response=await fetch(`${API_URL}/api/pricing`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load pricing plans');
  return data.plans||[];
}
export async function getPublicBlogs(){
  const response=await fetch(`${API_URL}/api/blogs`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load blogs');
  return data.blogs||[];
}
export async function getPublicBlog(slug){
  const response=await fetch(`${API_URL}/api/blogs/${encodeURIComponent(slug)}`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load the blog');
  return data.blog;
}
export async function getPublicTestimonials(){
  const response=await fetch(`${API_URL}/api/testimonials`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load testimonials');
  return data.testimonials||[];
}
export async function submitContactEnquiry(details){
  const response=await fetch(`${API_URL}/api/contact`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(details)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to send your enquiry');
  return data;
}
export async function subscribeNewsletter(email,source='Homepage'){
  const response=await fetch(`${API_URL}/api/newsletter`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,source})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to complete your subscription');
  return data;
}
export async function getPublicPartners(){
  const response=await fetch(`${API_URL}/api/partners`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load partners');
  return data.partners||[];
}
export async function getPublicSettings(){
  const response=await fetch(`${API_URL}/api/settings`,{cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to load site settings');
  return data.settings;
}
