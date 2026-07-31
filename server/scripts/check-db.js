import {pool} from '../config/db.js';

try{
  const {rows}=await pool.query(`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='last_totp_counter') AS has_totp_counter,
      to_regclass('public.admin_sessions') IS NOT NULL AS has_admin_sessions
  `);
  const checks=rows[0];
  if(!checks.has_totp_counter||!checks.has_admin_sessions)throw new Error('Security schema is incomplete; run npm run db:init --prefix server');
  console.log('Database security schema verified.');
}catch(error){
  console.error(error.message);
  process.exitCode=1;
}finally{await pool.end()}
