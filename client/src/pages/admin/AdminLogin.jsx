import React,{useState} from 'react';
import * as I from 'lucide-react';
import { loginAdmin } from '../../services/admin/admin-api';
import BrandLogo from '../../components/BrandLogo';

export default function AdminLogin({onLogin}){
  const [email,setEmail]=useState('info@mikenium.com');
  const [password,setPassword]=useState('');
  const [code,setCode]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(event){
    event.preventDefault(); setError(''); setLoading(true);
    try{const session=await loginAdmin(email,password,code);onLogin(session.user);}
    catch(err){setError(err.message);}
    finally{setLoading(false);}
  }
  return <div className="admin-login-page">
    <div className="admin-login-brand"><BrandLogo alt="Mikenium — Building Smarter Software"/><span>Secure administration portal</span></div>
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-login-icon"><I.ShieldCheck/></div>
      <h1>Super Admin Login</h1><p>Sign in to manage the Mikenium platform.</p>
      {error&&<div className="admin-login-error" role="alert"><I.CircleAlert/>{error}</div>}
      <label>Email address<div className="admin-login-input"><I.Mail/><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label>
      <label>Password<div className="admin-login-input"><I.LockKeyhole/><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required autoFocus/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<I.EyeOff/>:<I.Eye/>}</button></div></label>
      <label>Authenticator code<div className="admin-login-input"><I.Smartphone/><input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" required/></div></label>
      <button className="admin-login-submit" disabled={loading}>{loading?<><I.LoaderCircle className="spin"/>Signing in...</>:<>Sign in securely<I.ArrowRight/></>}</button>
      <small><I.Lock/> Protected super-admin access</small>
    </form>
  </div>;
}
