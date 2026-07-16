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
