const API_URL=(import.meta.env.VITE_API_URL||'http://localhost:5000').replace(/\/$/,'');

export async function adminRequest(path,options={}){
  const response=await fetch(`${API_URL}${path}`,{
    ...options,
    credentials:'include',
    headers:{'Content-Type':'application/json',...options.headers}
  });
  if(response.status===204) return null;
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.message||'Unable to complete the request');
  return data;
}

export const getAdminSession=()=>adminRequest('/api/auth/super-admin/session');
export const loginAdmin=(email,password)=>adminRequest('/api/auth/super-admin/login',{method:'POST',body:JSON.stringify({email,password})});
export const logoutAdmin=()=>adminRequest('/api/auth/super-admin/logout',{method:'POST'});
export const getDashboard=()=>adminRequest('/api/admin/dashboard');
export const getUsers=(filters={})=>{const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==undefined&&value!==''));return adminRequest(`/api/admin/users${query.size?`?${query}`:''}`)};
export const getUser=id=>adminRequest(`/api/admin/users/${id}`);
export const createUser=data=>adminRequest('/api/admin/users',{method:'POST',body:JSON.stringify(data)});
export const updateUser=(id,data)=>adminRequest(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteUser=id=>adminRequest(`/api/admin/users/${id}`,{method:'DELETE'});
export const getClients=(filters={})=>{const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==undefined&&value!==''));return adminRequest(`/api/admin/clients${query.size?`?${query}`:''}`)};
export const getClient=id=>adminRequest(`/api/admin/clients/${id}`);
export const createClient=data=>adminRequest('/api/admin/clients',{method:'POST',body:JSON.stringify(data)});
export const updateClient=(id,data)=>adminRequest(`/api/admin/clients/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteClient=id=>adminRequest(`/api/admin/clients/${id}`,{method:'DELETE'});
export const getProjects=()=>adminRequest('/api/admin/projects');
export const getProject=id=>adminRequest(`/api/admin/projects/${id}`);
export const createProject=data=>adminRequest('/api/admin/projects',{method:'POST',body:JSON.stringify(data)});
export const updateProject=(id,data)=>adminRequest(`/api/admin/projects/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteProject=id=>adminRequest(`/api/admin/projects/${id}`,{method:'DELETE'});
export async function uploadProjectImage(file){
  const response=await fetch(`${API_URL}/api/admin/projects/image-upload`,{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':file.type},
    body:file
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to upload the project image');
  return data;
}
export const getServices=()=>adminRequest('/api/admin/services');
export const getService=id=>adminRequest(`/api/admin/services/${id}`);
export const createService=data=>adminRequest('/api/admin/services',{method:'POST',body:JSON.stringify(data)});
export const updateService=(id,data)=>adminRequest(`/api/admin/services/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteService=id=>adminRequest(`/api/admin/services/${id}`,{method:'DELETE'});
export const getProducts=()=>adminRequest('/api/admin/products');
export const getProduct=id=>adminRequest(`/api/admin/products/${id}`);
export const createProduct=data=>adminRequest('/api/admin/products',{method:'POST',body:JSON.stringify(data)});
export const updateProduct=(id,data)=>adminRequest(`/api/admin/products/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteProduct=id=>adminRequest(`/api/admin/products/${id}`,{method:'DELETE'});
export async function uploadProductImage(file){
  const response=await fetch(`${API_URL}/api/admin/products/image-upload`,{method:'POST',credentials:'include',headers:{'Content-Type':file.type},body:file});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to upload the product image');
  return data;
}
export const getPricingPlans=()=>adminRequest('/api/admin/pricing');
export const getPricingPlan=id=>adminRequest(`/api/admin/pricing/${id}`);
export const createPricingPlan=data=>adminRequest('/api/admin/pricing',{method:'POST',body:JSON.stringify(data)});
export const updatePricingPlan=(id,data)=>adminRequest(`/api/admin/pricing/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deletePricingPlan=id=>adminRequest(`/api/admin/pricing/${id}`,{method:'DELETE'});
export const getBlogs=()=>adminRequest('/api/admin/blogs');
export const getBlog=id=>adminRequest(`/api/admin/blogs/${id}`);
export const createBlog=data=>adminRequest('/api/admin/blogs',{method:'POST',body:JSON.stringify(data)});
export const updateBlog=(id,data)=>adminRequest(`/api/admin/blogs/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteBlog=id=>adminRequest(`/api/admin/blogs/${id}`,{method:'DELETE'});
export async function uploadBlogImage(file){
  const response=await fetch(`${API_URL}/api/admin/blogs/image-upload`,{method:'POST',credentials:'include',headers:{'Content-Type':file.type},body:file});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to upload the blog image');
  return data;
}
export const getTestimonials=()=>adminRequest('/api/admin/testimonials');
export const getTestimonial=id=>adminRequest(`/api/admin/testimonials/${id}`);
export const createTestimonial=data=>adminRequest('/api/admin/testimonials',{method:'POST',body:JSON.stringify(data)});
export const updateTestimonial=(id,data)=>adminRequest(`/api/admin/testimonials/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteTestimonial=id=>adminRequest(`/api/admin/testimonials/${id}`,{method:'DELETE'});
export async function uploadTestimonialAvatar(file){
  const response=await fetch(`${API_URL}/api/admin/testimonials/image-upload`,{method:'POST',credentials:'include',headers:{'Content-Type':file.type},body:file});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to upload the client image');
  return data;
}
export const getContactMessages=(filters={})=>{const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==undefined&&value!==''));return adminRequest(`/api/admin/contact-messages${query.size?`?${query}`:''}`)};
export const getContactMessage=id=>adminRequest(`/api/admin/contact-messages/${id}`);
export const updateContactMessage=(id,status)=>adminRequest(`/api/admin/contact-messages/${id}`,{method:'PATCH',body:JSON.stringify({status})});
export const replyToContactMessage=(id,body,type='REPLY')=>adminRequest(`/api/admin/contact-messages/${id}/replies`,{method:'POST',body:JSON.stringify({body,type})});
export const getPartners=()=>adminRequest('/api/admin/partners');
export const getPartner=id=>adminRequest(`/api/admin/partners/${id}`);
export const createPartner=data=>adminRequest('/api/admin/partners',{method:'POST',body:JSON.stringify(data)});
export const updatePartner=(id,data)=>adminRequest(`/api/admin/partners/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deletePartner=id=>adminRequest(`/api/admin/partners/${id}`,{method:'DELETE'});
export async function uploadPartnerLogo(file){
  const response=await fetch(`${API_URL}/api/admin/partners/logo-upload`,{method:'POST',credentials:'include',headers:{'Content-Type':file.type},body:file});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Unable to upload the partner logo');
  return data;
}
