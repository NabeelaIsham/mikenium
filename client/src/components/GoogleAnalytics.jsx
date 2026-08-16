import {useEffect} from 'react';

const MEASUREMENT_ID='G-NLCWPNYN8P';
const STORAGE_KEY='mikenium-cookie-consent';
const SCRIPT_ID='mikenium-google-analytics';

function analyticsAllowed(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))?.analytics===true}catch{return false}
}

function enableAnalytics(){
  window[`ga-disable-${MEASUREMENT_ID}`]=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  if(!window.__mikeniumGaInitialized){
    window.gtag('js',new Date());
    window.gtag('config',MEASUREMENT_ID,{anonymize_ip:true});
    window.__mikeniumGaInitialized=true;
  }
  if(document.getElementById(SCRIPT_ID))return;
  const script=document.createElement('script');
  script.id=SCRIPT_ID;
  script.async=true;
  script.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function disableAnalytics(){
  window[`ga-disable-${MEASUREMENT_ID}`]=true;
  document.getElementById(SCRIPT_ID)?.remove();
}

export default function GoogleAnalytics(){
  useEffect(()=>{
    const update=event=>(event?.detail?.analytics===true||(!event&&analyticsAllowed()))?enableAnalytics():disableAnalytics();
    update();
    window.addEventListener('mikenium:consent-changed',update);
    return()=>window.removeEventListener('mikenium:consent-changed',update);
  },[]);
  return null;
}

