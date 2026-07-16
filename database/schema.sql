CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','ADMIN','EDITOR','CLIENT','AUTHOR','SUBSCRIBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'CLIENT',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users (lower(username)) WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  ip_address inet,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_user_idx ON admin_audit_logs(user_id,created_at DESC);

-- Enforce one platform-level super admin at the database layer.
CREATE UNIQUE INDEX IF NOT EXISTS one_super_admin ON users ((role)) WHERE role='SUPER_ADMIN';

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  status varchar(40) NOT NULL DEFAULT 'PLANNED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_status_check CHECK (status IN ('PLANNED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED'))
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(180) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_status_check CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED','OUT_OF_STOCK'))
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(240) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_status_check CHECK (status IN ('DRAFT','PUBLISHED','SCHEDULED','ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name varchar(160) NOT NULL,
  sender_email varchar(255) NOT NULL,
  subject varchar(240) NOT NULL,
  message text NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_status_check CHECK (status IN ('NEW','READ','REPLIED','CLOSED','TRASH'))
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name varchar(180) NOT NULL,
  location varchar(180) NOT NULL,
  contact_name varchar(140) NOT NULL,
  contact_title varchar(120),
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(50),
  industry varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_status_check CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT clients_revenue_check CHECK (revenue >= 0)
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_status_created_idx ON projects(status,created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_created_idx ON products(status,created_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_status_created_idx ON blog_posts(status,created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx ON contact_messages(status,created_at DESC);
CREATE INDEX IF NOT EXISTS clients_status_created_idx ON clients(status,created_at DESC);
CREATE INDEX IF NOT EXISTS clients_industry_idx ON clients(industry);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id);
