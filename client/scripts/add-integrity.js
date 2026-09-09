import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const directory=fileURLToPath(new URL('../dist/',import.meta.url));
const filename=path.join(directory,'index.html');
let html=await readFile(filename,'utf8');
let count=0;
for(const match of html.matchAll(/<(?:script|link)\b[^>]*>/g)){
  const tag=match[0];
  if(tag.startsWith('<link')&&!/\brel="(?:stylesheet|modulepreload)"/.test(tag))continue;
  const reference=tag.match(/\b(?:src|href)="([^"]+)"/)?.[1];
  if(!reference)continue;
  const url=new URL(reference,'https://build.invalid/');
  if(url.origin!=='https://build.invalid')throw new Error('Build entrypoints must use local scripts and stylesheets');
  const asset=path.resolve(directory,`.${decodeURIComponent(url.pathname)}`);
  if(!asset.startsWith(directory))throw new Error('Build asset must stay inside dist');
  const integrity=`sha384-${createHash('sha384').update(await readFile(asset)).digest('base64')}`;
  const updated=tag.replace(/\s+integrity="[^"]*"/g,'').replace(/\s+crossorigin(?:="[^"]*")?/g,'');
  html=html.replace(tag,updated.replace(/\s*\/?>$/,` integrity="${integrity}" crossorigin="anonymous">`));
  count++;
}
if(!count)throw new Error('No build entrypoints found for integrity verification');
await writeFile(filename,html);
console.log(`Added SHA-384 integrity to ${count} entrypoint scripts, stylesheets, and module preloads.`);
