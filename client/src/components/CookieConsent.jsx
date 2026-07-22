import React,{useEffect,useState} from 'react';
import * as I from 'lucide-react';
import '../styles/legal-pages.css';

const STORAGE_KEY='mikenium-cookie-consent';
const defaults={necessary:true,analytics:false,marketing:false};

function persist(preferences){
  const consent={...preferences,necessary:true,updatedAt:new Date().toISOString()};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(consent));
  document.cookie=`mikenium_cookie_consent=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=15552000; Path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent('mikenium:consent-changed',{detail:consent}));
}

export default function CookieConsent(){
  const [visible,setVisible]=useState(false);
  const [settings,setSettings]=useState(false);
  const [preferences,setPreferences]=useState(defaults);
  useEffect(()=>{
    const legalRoutes={'Privacy Policy':'/privacy-policy','Terms of Service':'/terms-of-service','Cookie Policy':'/cookie-policy'};
    document.querySelectorAll('.footer-bottom nav a').forEach(link=>{if(legalRoutes[link.textContent.trim()])link.setAttribute('href',legalRoutes[link.textContent.trim()])});
    try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(saved)setPreferences({...defaults,...saved});else setVisible(true)}catch{setVisible(true)}
    const open=()=>{setVisible(true);setSettings(true)};
    window.addEventListener('mikenium:open-cookie-settings',open);
    return()=>window.removeEventListener('mikenium:open-cookie-settings',open);
  },[]);
  const save=value=>{persist(value);setVisible(false);setSettings(false)};
  if(!visible)return null;
  return <div className="cookie-layer" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
    <section className="cookie-card">
      <button className="cookie-close" onClick={()=>setVisible(false)} aria-label="Close cookie notice"><I.X/></button>
      <span className="cookie-icon"><I.Cookie/></span>
      <div className="cookie-copy"><h2 id="cookie-title">Your privacy, your choice</h2><p>We use essential cookies to keep this site working. With your permission, we may also use analytics and marketing cookies to improve your experience. Read our <a href="/cookie-policy">Cookie Policy</a>.</p></div>
      {settings&&<div className="cookie-options">
        <label><span><b>Necessary</b><small>Required for security and core website functions.</small></span><input type="checkbox" checked disabled/></label>
        <label><span><b>Analytics</b><small>Helps us understand how visitors use the website.</small></span><input type="checkbox" checked={preferences.analytics} onChange={e=>setPreferences({...preferences,analytics:e.target.checked})}/></label>
        <label><span><b>Marketing</b><small>Supports relevant campaigns and measures their results.</small></span><input type="checkbox" checked={preferences.marketing} onChange={e=>setPreferences({...preferences,marketing:e.target.checked})}/></label>
      </div>}
      <div className="cookie-actions">
        {!settings&&<button className="cookie-secondary" onClick={()=>setSettings(true)}>Manage choices</button>}
        {settings&&<button className="cookie-secondary" onClick={()=>save(preferences)}>Save choices</button>}
        <button className="cookie-secondary" onClick={()=>save(defaults)}>Reject optional</button>
        <button className="cookie-primary" onClick={()=>save({necessary:true,analytics:true,marketing:true})}>Accept all</button>
      </div>
    </section>
  </div>;
}
