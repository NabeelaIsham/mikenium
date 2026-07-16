import {Facebook,Instagram,Linkedin,Music2,Youtube} from 'lucide-react';

export const companyContact={
  email:'info@mikenium.com',
  emailHref:'mailto:info@mikenium.com',
  phones:[
    {label:'078 789 6876',href:'tel:+94787896876'},
    {label:'076 995 6938',href:'tel:+94769956938'}
  ],
  phoneDisplay:'078 789 6876 / 076 995 6938',
  address:'116 Marikkar Street, Kalutara South',
  mapsUrl:'https://maps.google.com/?q=116+Marikkar+Street+Kalutara+South',
  socialLinks:[
    {label:'Facebook',href:'https://www.facebook.com/',Icon:Facebook},
    {label:'Instagram',href:'https://www.instagram.com/',Icon:Instagram},
    {label:'LinkedIn',href:'https://www.linkedin.com/',Icon:Linkedin},
    {label:'TikTok',href:'https://www.tiktok.com/',Icon:Music2},
    {label:'YouTube',href:'https://www.youtube.com/',Icon:Youtube}
  ]
};

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
