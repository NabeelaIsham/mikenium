import pg from 'pg';
import {env} from './env.js';
const { Pool } = pg;
export const pool = new Pool({
  connectionString:env.databaseUrl,
  max:Number(process.env.DB_POOL_MAX||10),
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:5000,
  statement_timeout:30000,
  application_name:'mikenium-api'
});

pool.on('error',error=>console.error('Unexpected PostgreSQL pool error:',error.message));
