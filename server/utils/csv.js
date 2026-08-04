export function csvCell(value){
  let safe=String(value??'');
  if(/^[\t\r\n ]*[=+\-@]/.test(safe))safe=`'${safe}`;
  return `"${safe.replaceAll('"','""')}"`;
}
