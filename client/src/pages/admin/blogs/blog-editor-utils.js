export const MAX_BLOG_BLOCKS = 300;

// Destination is a gap in the original array, including the gap after its last item.
export function moveBlockToGap(blocks, id, destination) {
  const from = blocks.findIndex(block => block.id === id);
  if (from < 0 || destination < 0 || destination > blocks.length) return blocks;
  const next = [...blocks];
  const [block] = next.splice(from,1);
  next.splice(destination > from ? destination - 1 : destination,0,block);
  return next;
}

// Plain text shortcuts, deliberately not an HTML/Markdown renderer.
export function importArticleText(text, makeId) {
  const blocks = [];
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) blocks.push({id:makeId(),type:'paragraph',text:paragraph.join('\n'),lead:false});
    paragraph = [];
  };
  for (const line of text.replace(/\r\n?/g,'\n').split('\n')) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (!line.trim()) { flush(); continue; }
    if (heading) {
      flush();
      blocks.push({id:makeId(),type:'heading',title:heading[2].trim(),eyebrow:'',level:Math.max(2,heading[1].length)});
    } else if (item) {
      flush();
      const last = blocks.at(-1);
      if (last?.type === 'list' && last.items.length < 20) last.items.push(item[1].trim());
      else blocks.push({id:makeId(),type:'list',title:'',items:[item[1].trim()]});
    } else paragraph.push(line);
  }
  flush();
  return blocks;
}
