import bcrypt from 'bcryptjs'; import { pool } from '../config/db.js';
const [email,password,name='Super Admin']=process.argv.slice(2);
if(!email||!password){console.error('Usage: npm run admin:create -- <email> <password> [name]');process.exit(1)}
if(password.length<12){console.error('Password must contain at least 12 characters.');process.exit(1)}
try { const hash=await bcrypt.hash(password,12); await pool.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,lower($2),$3,'SUPER_ADMIN') ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='SUPER_ADMIN',active=true`,[name,email,hash]); console.log(`Company super admin provisioned: ${email}`); }
catch(error){console.error(error.message);process.exitCode=1} finally {await pool.end()}
