# Mikenium Super Admin

PERN super-admin dashboard matching the supplied reference, with a responsive React UI, Express API, and PostgreSQL persistence.

## Setup

1. Create the PostgreSQL database: `createdb -U postgres mikenium`
2. Copy `server/.env.example` to `server/.env`, replace the JWT secret, and keep `SUPER_ADMIN_EMAIL=info@mikenium.com`.
3. Install packages: `npm install` then `npm run install:all`
4. Initialize tables: `npm run db:init --prefix server`
5. Provision the company-owned account (there is deliberately no website registration):
   `npm run admin:create --prefix server -- "a-strong-unique-password"`
   The default username is `info@mikenium.com`. To override it, pass email then password.
6. Start both applications: `npm run dev`

Public website: http://localhost:5173 · Admin dashboard: http://localhost:5173/admin · API: http://localhost:5000

## Production deployment

The repository includes a hardened Docker deployment for a single Namecheap VPS: PostgreSQL, the application, persistent uploads/encrypted backups, and automatic HTTPS through Caddy. Follow [DEPLOYMENT.md](./DEPLOYMENT.md). Do not deploy using the development commands above.

## Super-admin security model

- The public `/api/auth/login` route rejects accounts with the `SUPER_ADMIN` role.
- A super admin can only be created from the server command line by the company.
- The admin login creates an 8-hour, HTTP-only, SameSite cookie containing a signed JWT.
- Admin routes verify both the signed JWT and the `SUPER_ADMIN` role.
- Login activity is written to `admin_audit_logs`.
- PostgreSQL enforces a single super-admin account using a partial unique index.
- The protected dashboard API reads live totals, seven-day trends, audit activity, recent users, services, projects, products, blogs, and contact-message summaries from PostgreSQL.
- The protected Users API provides PostgreSQL-backed create, list/read, update, and delete operations with bcrypt password hashing, validation, uniqueness checks, audit logs, and super-admin account protection.
- The protected Clients API provides PostgreSQL-backed organization CRUD, contact details, status, revenue and project counts, filters, uniqueness validation, and audit logging.

In production, serve the admin over HTTPS, consider restricting `/api/auth/super-admin/*` to the company VPN or office IP range, and keep PostgreSQL credentials in a secret manager.
