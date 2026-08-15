const logoAssets = {
  header: {
    dark: {mobile: '/assets/logos/mobile-header-dark.svg', web: '/assets/logos/web-header-dark.svg'},
    light: {mobile: '/assets/logos/mobile-header-light.svg', web: '/assets/logos/web-header-light.svg'},
  },
  footer: {
    dark: {mobile: '/assets/logos/mobile-footer-dark.svg', web: '/assets/logos/web-footer-dark.svg'},
    light: {mobile: '/assets/logos/mobile-footer-light.svg', web: '/assets/logos/web-footer-light.svg'},
  },
};

export default function BrandLogo({position = 'header', tone = 'dark', alt = 'Mikenium — Building Smarter Software', loading}) {
  const assets = logoAssets[position]?.[tone] || logoAssets.header.dark;
  const mobileBreakpoint = position === 'footer' ? '700px' : '520px';
  return <picture className={`brand-logo-picture brand-logo-${position} brand-logo-${tone}`} data-brand-logo>
    <source media={`(max-width: ${mobileBreakpoint})`} srcSet={assets.mobile}/>
    <img src={assets.web} alt={alt} loading={loading} decoding="async"/>
  </picture>;
}
