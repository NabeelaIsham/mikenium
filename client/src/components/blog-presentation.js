export const BLOG_FONTS = ['Inter','DM Sans','Manrope','Arial','Georgia','Courier New'];

export function blockPresentation(value = {}) {
  const attributes = {};
  const style = {};
  const set = (name, val) => { attributes[`data-${name}`]='true'; style[`--blog-${name}`]=val; };
  if (BLOG_FONTS.includes(value.fontFamily)) set('font',`"${value.fontFamily}", ${value.fontFamily === 'Georgia' ? 'serif' : value.fontFamily === 'Courier New' ? 'monospace' : 'sans-serif'}`);
  if (Number.isInteger(value.fontSize) && value.fontSize >= 12 && value.fontSize <= 80) set('size',`clamp(12px, ${value.fontSize / 16}rem, ${value.fontSize}px)`);
  if (['400','500','600','700','800'].includes(value.fontWeight)) set('weight',value.fontWeight);
  if (typeof value.italic === 'boolean') set('italic',value.italic?'italic':'normal');
  if (typeof value.underline === 'boolean') set('underline',value.underline?'underline':'none');
  if (['left','center','right'].includes(value.align)) set('align',value.align);
  if (Number.isFinite(value.lineHeight) && value.lineHeight >= 1 && value.lineHeight <= 2.5) set('line',value.lineHeight);
  if (/^#[0-9a-f]{6}$/i.test(value.color)) set('color',value.color);
  if (/^#[0-9a-f]{6}$/i.test(value.background)) style.backgroundColor=value.background;
  if (Number.isInteger(value.padding) && value.padding >= 0 && value.padding <= 64) style.padding=`${value.padding}px`;
  if (Number.isInteger(value.radius) && value.radius >= 0 && value.radius <= 40) style.borderRadius=`${value.radius}px`;
  return {...attributes,style};
}
