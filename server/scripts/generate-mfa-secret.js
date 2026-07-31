import {randomBytes} from 'crypto';

const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buffer){
  let bits='';for(const byte of buffer)bits+=byte.toString(2).padStart(8,'0');
  let output='';for(let index=0;index<bits.length;index+=5)output+=alphabet[parseInt(bits.slice(index,index+5).padEnd(5,'0'),2)];
  return output;
}

const email=process.argv[2]||process.env.SUPER_ADMIN_EMAIL||'info@mikenium.com';
const secret=base32(randomBytes(20));
const label=encodeURIComponent(`Mikenium:${email}`);
const issuer=encodeURIComponent('Mikenium');
console.log(`SUPER_ADMIN_TOTP_SECRET=${secret}`);
console.log(`Authenticator URI: otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`);
