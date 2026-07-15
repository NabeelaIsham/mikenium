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

## Super-admin security model

- The public `/api/auth/login` route rejects accounts with the `SUPER_ADMIN` role.
- A super admin can only be created from the server command line by the company.
- The admin login creates an 8-hour, HTTP-only, SameSite cookie containing a signed JWT.
- Admin routes verify both the signed JWT and the `SUPER_ADMIN` role.
- Login activity is written to `admin_audit_logs`.
- PostgreSQL enforces a single super-admin account using a partial unique index.

In production, serve the admin over HTTPS, consider restricting `/api/auth/super-admin/*` to the company VPN or office IP range, and keep PostgreSQL credentials in a secret manager.
