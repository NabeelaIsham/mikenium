import {Facebook,Instagram,Linkedin,Music2,Youtube} from 'lucide-react';

export const companyContact={
  logoUrl:'/assets/mikenium-logo-transparent.png',
  logoAlt:'Mikenium — Building Smarter Software',
  email:'info@mikenium.com',
  emailHref:'mailto:info@mikenium.com',
  phones:[
    {label:'078 789 6876',href:'tel:+94787896876'},
    {label:'076 995 6938',href:'tel:+94769956938'}
  ],
  phoneDisplay:'078 789 6876 / 076 995 6938',
  address:'116 Marikkar Street, Kalutara South',
  mapsUrl:'https://maps.google.com/?q=116+Marikkar+Street+Kalutara+South',
  businessHours:'Monday–Friday, 9:00 AM–6:00 PM',
  footerDescription:'We design and engineer secure digital products that help ambitious businesses grow with confidence.',
  copyright:'© 2026 Mikenium. All rights reserved.',
  showSystemStatus:true,
  socialLinks:[
    {label:'Facebook',href:'https://www.facebook.com/',Icon:Facebook},
    {label:'Instagram',href:'https://www.instagram.com/',Icon:Instagram},
    {label:'LinkedIn',href:'https://www.linkedin.com/',Icon:Linkedin},
    {label:'TikTok',href:'https://www.tiktok.com/',Icon:Music2},
    {label:'YouTube',href:'https://www.youtube.com/',Icon:Youtube}
  ]
};

const iconByNetwork={facebook:Facebook,instagram:Instagram,linkedin:Linkedin,tiktok:Music2,youtube:Youtube};
const telHref=value=>`tel:${String(value||'').replace(/[^+\d]/g,'')}`;
export function applyPublicSiteSettings(settings={}){
  const general=settings.general||{},identity=settings.identity||{},social=settings.social||{},others=settings.others||{};
  companyContact.logoUrl=identity.logoUrl||companyContact.logoUrl;companyContact.logoAlt=identity.logoAlt||companyContact.logoAlt;
  companyContact.email=general.contactEmail||companyContact.email;companyContact.emailHref=`mailto:${companyContact.email}`;
  const phones=[general.phonePrimary,general.phoneSecondary].filter(Boolean);if(phones.length)companyContact.phones=phones.map(label=>({label,href:telHref(label)}));
  companyContact.phoneDisplay=phones.join(' / ')||companyContact.phoneDisplay;companyContact.address=general.address||companyContact.address;
  companyContact.mapsUrl=others.mapsUrl||companyContact.mapsUrl;companyContact.businessHours=others.businessHours||companyContact.businessHours;
  companyContact.footerDescription=others.footerDescription||companyContact.footerDescription;companyContact.copyright=others.copyright||companyContact.copyright;companyContact.showSystemStatus=others.showSystemStatus!==false;
  const links=Object.entries(iconByNetwork).filter(([key])=>social[key]).map(([key,Icon])=>({label:key==='linkedin'?'LinkedIn':key==='tiktok'?'TikTok':key==='youtube'?'YouTube':key[0].toUpperCase()+key.slice(1),href:social[key],Icon}));if(links.length)companyContact.socialLinks=links;
  return companyContact;
}

export const footerNavigation=[
  {
    title:'Company',
    links:[
      {label:'Home',href:'/'},
      {label:'About Us',href:'/about'},
      {label:'Our Work',href:'/portfolio'},
      {label:'Contact',href:'/contact'}
    ]
  },
  {
    title:'Expertise',
    links:[
      {label:'Web Development',href:'/services#capabilities'},
      {label:'Mobile Applications',href:'/services#capabilities'},
      {label:'Cloud & DevOps',href:'/services#capabilities'},
      {label:'UI/UX Design',href:'/services#capabilities'}
    ]
  },
  {
    title:'Resources',
    links:[
      {label:'Insights & Blog',href:'/blog'},
      {label:'Products',href:'/products'},
      {label:'Pricing',href:'/pricing'},
      {label:'Client Stories',href:'/#about'}
    ]
  }
];
