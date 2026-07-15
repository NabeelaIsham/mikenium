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
