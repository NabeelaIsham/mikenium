# Mikenium Super Admin

PERN super-admin dashboard matching the supplied reference, with a responsive React UI, Express API, and PostgreSQL persistence.

## Setup

1. Create the PostgreSQL database: `createdb -U postgres mikenium`
2. Copy `server/.env.example` to `server/.env` and replace the JWT secret and company access key.
3. Install packages: `npm install` then `npm run install:all`
4. Initialize tables: `npm run db:init --prefix server`
5. Provision the company-owned account (there is deliberately no website registration):
   `npm run admin:create --prefix server -- superadmin@mikenium.com "a-strong-unique-password" "Super Admin"`
6. Start both applications: `npm run dev`

Client: http://localhost:5173 · API: http://localhost:5000

## Super-admin security model

- The public `/api/auth/login` route rejects accounts with the `SUPER_ADMIN` role.
- A super admin can only be created from the server command line by the company.
- The private session route requires `x-company-access-key`, a secret that must never be included in frontend code.
- Admin API routes additionally require a signed JWT containing the `SUPER_ADMIN` role.
- Login activity is written to `admin_audit_logs`.
- PostgreSQL enforces a single super-admin account using a partial unique index.

In production, also restrict `/api/auth/company/*` at the reverse proxy/firewall to the company VPN or office IP range and keep PostgreSQL credentials in a secret manager.
