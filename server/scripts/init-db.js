import fs from 'node:fs/promises'; import { pool } from '../config/db.js';
try { const sql=await fs.readFile(new URL('../../database/schema.sql',import.meta.url),'utf8'); await pool.query(sql); console.log('Database schema initialized.'); }
catch(error){console.error(error.message);process.exitCode=1} finally {await pool.end()}
