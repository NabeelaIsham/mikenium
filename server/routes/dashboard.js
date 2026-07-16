import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router=Router();
const number=value=>Number(value||0);
const change=(current,previous)=>previous ? Number((((current-previous)/previous)*100).toFixed(1)) : (current ? 100 : 0);
const titleize=value=>value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());

router.get('/',requireSuperAdmin,async(req,res)=>{
  const client=await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const [countsResult,chartResult,activityResult,userResult,serviceResult]=await Promise.all([
      client.query(`
        SELECT
          (SELECT count(*) FROM users) AS users_total,
          (SELECT count(*) FROM users WHERE created_at>=now()-interval '7 days') AS users_current,
          (SELECT count(*) FROM users WHERE created_at>=now()-interval '14 days' AND created_at<now()-interval '7 days') AS users_previous,
          (SELECT count(*) FROM clients) AS clients_total,
          (SELECT count(*) FROM clients WHERE created_at>=now()-interval '7 days') AS clients_current,
          (SELECT count(*) FROM clients WHERE created_at>=now()-interval '14 days' AND created_at<now()-interval '7 days') AS clients_previous,
          (SELECT count(*) FROM projects) AS projects_total,
          (SELECT count(*) FROM projects WHERE created_at>=now()-interval '7 days') AS projects_current,
          (SELECT count(*) FROM projects WHERE created_at>=now()-interval '14 days' AND created_at<now()-interval '7 days') AS projects_previous,
          (SELECT count(*) FROM products) AS products_total,
          (SELECT count(*) FROM products WHERE created_at>=now()-interval '7 days') AS products_current,
          (SELECT count(*) FROM products WHERE created_at>=now()-interval '14 days' AND created_at<now()-interval '7 days') AS products_previous,
          (SELECT count(*) FROM blog_posts) AS blogs_total,
          (SELECT count(*) FROM blog_posts WHERE created_at>=now()-interval '7 days') AS blogs_current,
          (SELECT count(*) FROM blog_posts WHERE created_at>=now()-interval '14 days' AND created_at<now()-interval '7 days') AS blogs_previous,
          (SELECT count(*) FROM users WHERE active) AS active_users,
          (SELECT count(*) FROM clients WHERE status='ACTIVE') AS active_clients,
          (SELECT count(*) FROM projects WHERE status='IN_PROGRESS') AS running_projects,
          (SELECT count(*) FROM contact_messages WHERE status='NEW' AND subject ILIKE '%support%') AS support_tickets,
          (SELECT count(*) FROM contact_messages WHERE status='NEW') AS messages
      `),
      client.query(`
        WITH days AS (SELECT generate_series(current_date-6,current_date,interval '1 day')::date AS day)
        SELECT to_char(days.day,'Mon DD') AS label,
          (SELECT count(*) FROM users WHERE created_at::date<=days.day) AS users,
          (SELECT count(*) FROM clients WHERE created_at::date<=days.day) AS clients,
          (SELECT count(*) FROM projects WHERE created_at::date<=days.day) AS projects
        FROM days ORDER BY days.day
      `),
      client.query(`
        SELECT l.id,l.action,l.metadata,l.created_at,u.name AS user_name,u.email
        FROM admin_audit_logs l LEFT JOIN users u ON u.id=l.user_id
        ORDER BY l.created_at DESC LIMIT 5
      `),
      client.query(`
        SELECT id,name,email,role,created_at FROM users
        WHERE role<>'SUPER_ADMIN' ORDER BY created_at DESC LIMIT 5
      `),
      client.query(`
        SELECT s.name,count(p.id)::int AS value
        FROM services s LEFT JOIN projects p ON p.service_id=s.id
        WHERE s.active GROUP BY s.id,s.name ORDER BY value DESC,s.name LIMIT 5
      `)
    ]);
    await client.query('COMMIT');

    const c=countsResult.rows[0];
    const metric=key=>({value:number(c[`${key}_total`]),change:change(number(c[`${key}_current`]),number(c[`${key}_previous`]))});
    const colors=['#0874e8','#35b96f','#8a59dd','#ffb42e','#6fa9ef'];
    res.set('Cache-Control','no-store').json({
      generatedAt:new Date().toISOString(),
      range:{from:new Date(Date.now()-6*86400000).toISOString(),to:new Date().toISOString()},
      totals:{users:metric('users'),clients:metric('clients'),projects:metric('projects'),products:metric('products'),blogs:metric('blogs')},
      system:{activeUsers:number(c.active_users),activeClients:number(c.active_clients),runningProjects:number(c.running_projects),supportTickets:number(c.support_tickets),messages:number(c.messages)},
      chart:chartResult.rows.map(row=>({label:row.label,users:number(row.users),projects:number(row.projects),clients:number(row.clients)})),
      recentActivities:activityResult.rows.map(row=>({id:row.id,title:titleize(row.action),description:row.metadata?.description||`${row.user_name||'System'} performed ${titleize(row.action).toLowerCase()}.`,createdAt:row.created_at})),
      recentUsers:userResult.rows.map(row=>({id:row.id,name:row.name,email:row.email,role:titleize(row.role),createdAt:row.created_at})),
      topServices:serviceResult.rows.map((row,index)=>({name:row.name,value:number(row.value),color:colors[index%colors.length]}))
    });
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  } finally {
    client.release();
  }
});

export default router;
