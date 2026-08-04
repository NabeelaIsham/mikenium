import {pool} from '../config/db.js';
import {runMigrations} from '../services/migrations.js';
try { await runMigrations(); console.log('Database migrations are current.'); }
catch(error){console.error(error.message);process.exitCode=1} finally {await pool.end()}
