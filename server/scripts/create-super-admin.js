import bcrypt from 'bcryptjs'; import { pool } from '../config/db.js';
const [first,second,third]=process.argv.slice(2);
const email=second ? first : (process.env.SUPER_ADMIN_EMAIL||'info@mikenium.com');
const password=second||first||process.env.ADMIN_PASSWORD;
const name=third||'Super Admin';
if(!password){console.error('Usage: npm run admin:create -- [email] <password> [name], or set ADMIN_PASSWORD');process.exit(1)}
if(password.length<12){console.error('Password must contain at least 12 characters.');process.exit(1)}
try {
  const hash=await bcrypt.hash(password,12);
  await pool.query('BEGIN');
  const {rows}=await pool.query("SELECT id FROM users WHERE role='SUPER_ADMIN' FOR UPDATE");
  if(rows[0]) await pool.query("UPDATE users SET name=$1,email=lower($2),password_hash=$3,active=true,updated_at=now() WHERE id=$4",[name,email,hash,rows[0].id]);
  else await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,lower($2),$3,'SUPER_ADMIN')",[name,email,hash]);
  await pool.query('COMMIT');
  console.log(`Company super admin provisioned: ${email}`);
}
catch(error){await pool.query('ROLLBACK').catch(()=>{});console.error(error.message);process.exitCode=1} finally {await pool.end()}
