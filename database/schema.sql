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

ALTER TABLE services ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Development';
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_type varchar(40) NOT NULL DEFAULT 'Core Service';
ALTER TABLE services ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tagline varchar(120) NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon varchar(40) NOT NULL DEFAULT 'code';
DO $$ BEGIN
  ALTER TABLE services ADD CONSTRAINT services_status_check CHECK (status IN ('PUBLISHED','DRAFT','INACTIVE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) UNIQUE NOT NULL,
  eyebrow varchar(80) NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  monthly_price numeric(12,2),
  annual_monthly_price numeric(12,2),
  monthly_price_lkr numeric(14,2),
  annual_monthly_price_lkr numeric(14,2),
  monthly_price_aud numeric(12,2),
  annual_monthly_price_aud numeric(12,2),
  currency varchar(10) NOT NULL DEFAULT 'USD',
  billing_suffix varchar(80) NOT NULL DEFAULT '/ month',
  features text[] NOT NULL DEFAULT '{}',
  cta_label varchar(80) NOT NULL DEFAULT 'Get started',
  cta_url text NOT NULL DEFAULT '/contact',
  icon varchar(40) NOT NULL DEFAULT 'rocket',
  is_custom boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'DRAFT',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_plans_status_check CHECK (status IN ('PUBLISHED','DRAFT','ARCHIVED')),
  CONSTRAINT pricing_plans_prices_check CHECK (
    (is_custom = true) OR
    (monthly_price IS NOT NULL AND monthly_price >= 0 AND annual_monthly_price IS NOT NULL AND annual_monthly_price >= 0
      AND monthly_price_lkr IS NOT NULL AND monthly_price_lkr >= 0 AND annual_monthly_price_lkr IS NOT NULL AND annual_monthly_price_lkr >= 0
      AND monthly_price_aud IS NOT NULL AND monthly_price_aud >= 0 AND annual_monthly_price_aud IS NOT NULL AND annual_monthly_price_aud >= 0)
  )
);

ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS monthly_price_lkr numeric(14,2);
ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS annual_monthly_price_lkr numeric(14,2);
ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS monthly_price_aud numeric(12,2);
ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS annual_monthly_price_aud numeric(12,2);
UPDATE pricing_plans SET
  monthly_price_lkr=COALESCE(monthly_price_lkr,ROUND(monthly_price*300,2)),
  annual_monthly_price_lkr=COALESCE(annual_monthly_price_lkr,ROUND(annual_monthly_price*300,2)),
  monthly_price_aud=COALESCE(monthly_price_aud,ROUND(monthly_price*1.55,2)),
  annual_monthly_price_aud=COALESCE(annual_monthly_price_aud,ROUND(annual_monthly_price*1.55,2))
WHERE is_custom=false;
ALTER TABLE pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_prices_check;
ALTER TABLE pricing_plans ADD CONSTRAINT pricing_plans_prices_check CHECK (
  is_custom=true OR (
    monthly_price IS NOT NULL AND monthly_price>=0 AND annual_monthly_price IS NOT NULL AND annual_monthly_price>=0
    AND monthly_price_lkr IS NOT NULL AND monthly_price_lkr>=0 AND annual_monthly_price_lkr IS NOT NULL AND annual_monthly_price_lkr>=0
    AND monthly_price_aud IS NOT NULL AND monthly_price_aud>=0 AND annual_monthly_price_aud IS NOT NULL AND annual_monthly_price_aud>=0
  )
);

INSERT INTO pricing_plans(name,eyebrow,description,monthly_price,annual_monthly_price,monthly_price_lkr,annual_monthly_price_lkr,monthly_price_aud,annual_monthly_price_aud,currency,billing_suffix,features,cta_label,cta_url,icon,is_custom,is_popular,status,display_order)
VALUES
  ('Starter','LAUNCH','A focused foundation for startups and smaller digital projects.',19,15,5700,4500,29.45,23.25,'USD','/ month',ARRAY['1 active project','5 GB secure storage','Essential support','Community access','Regular product updates'],'Get started','/contact','rocket',false,false,'PUBLISHED',1),
  ('Professional','GROW','More capacity and collaboration for ambitious growing teams.',49,39,14700,11700,75.95,60.45,'USD','/ month',ARRAY['10 active projects','50 GB secure storage','Priority support','Team collaboration','Advanced analytics','API access'],'Get started','/contact','zap',false,false,'PUBLISHED',2),
  ('Business','SCALE','Advanced delivery, insight, and support for established businesses.',99,79,29700,23700,153.45,122.45,'USD','/ month',ARRAY['Unlimited projects','200 GB secure storage','24/7 priority support','Team collaboration','Advanced analytics','API access','Custom integrations'],'Choose Business','/contact','chart',false,true,'PUBLISHED',3),
  ('Enterprise','TRANSFORM','Tailored software, security, and support for complex organizations.',NULL,NULL,NULL,NULL,NULL,NULL,'USD','/ month',ARRAY['Unlimited projects and storage','Dedicated success team','Advanced security controls','Custom integrations','SLA guarantee','On-premise options'],'Contact sales','/contact','shield',true,false,'PUBLISHED',4)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug varchar(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Business Platform';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type varchar(100) NOT NULL DEFAULT 'Web Application';
ALTER TABLE products ADD COLUMN IF NOT EXISTS platform varchar(100) NOT NULL DEFAULT 'Web';
ALTER TABLE products ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tech_stack text[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx ON products(lower(slug)) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(240) NOT NULL,
  slug varchar(220),
  excerpt text NOT NULL DEFAULT '',
  category varchar(100) NOT NULL DEFAULT 'Engineering',
  author_name varchar(140) NOT NULL DEFAULT 'Mikenium Team',
  author_title varchar(160) NOT NULL DEFAULT '',
  author_bio text NOT NULL DEFAULT '',
  author_avatar_url text,
  cover_image_url text,
  cover_caption varchar(240) NOT NULL DEFAULT '',
  reading_minutes smallint NOT NULL DEFAULT 5,
  tags text[] NOT NULL DEFAULT '{}',
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title varchar(240) NOT NULL DEFAULT '',
  seo_description varchar(320) NOT NULL DEFAULT '',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  scheduled_at timestamptz,
  views integer NOT NULL DEFAULT 0,
  status varchar(30) NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_status_check CHECK (status IN ('DRAFT','PUBLISHED','SCHEDULED','ARCHIVED')),
  CONSTRAINT blog_posts_reading_minutes_check CHECK (reading_minutes BETWEEN 1 AND 120),
  CONSTRAINT blog_posts_views_check CHECK (views >= 0)
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS slug varchar(220);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt text NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Engineering';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_name varchar(140) NOT NULL DEFAULT 'Mikenium Team';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_title varchar(160) NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_bio text NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_avatar_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_caption varchar(240) NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reading_minutes smallint NOT NULL DEFAULT 5;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_title varchar(240) NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_description varchar(320) NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx ON blog_posts(lower(slug)) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name varchar(140) NOT NULL,
  client_title varchar(160) NOT NULL DEFAULT '',
  company varchar(180) NOT NULL,
  testimonial text NOT NULL,
  service varchar(140) NOT NULL,
  result varchar(160) NOT NULL DEFAULT '',
  rating numeric(2,1) NOT NULL DEFAULT 5,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  display_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_status_check CHECK (status IN ('PUBLISHED','PENDING','HIDDEN','ARCHIVED')),
  CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5)
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

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS company varchar(180) NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone varchar(50) NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS service varchar(140) NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS channel varchar(60) NOT NULL DEFAULT 'Contact Form';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS user_agent text NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS notification_status varchar(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS notification_error text NOT NULL DEFAULT '';
DO $$ BEGIN
  ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_notification_status_check CHECK (notification_status IN ('PENDING','SENT','FAILED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS contact_message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reply_type varchar(20) NOT NULL DEFAULT 'REPLY',
  body text NOT NULL,
  recipient_email varchar(255),
  email_status varchar(20) NOT NULL DEFAULT 'NOT_REQUIRED',
  email_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_message_replies_type_check CHECK (reply_type IN ('REPLY','INTERNAL_NOTE')),
  CONSTRAINT contact_message_replies_email_status_check CHECK (email_status IN ('PENDING','SENT','FAILED','NOT_REQUIRED'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  source varchar(80) NOT NULL DEFAULT 'Homepage',
  confirmation_status varchar(20) NOT NULL DEFAULT 'PENDING',
  confirmation_error text NOT NULL DEFAULT '',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_status_check CHECK (status IN ('ACTIVE','UNSUBSCRIBED')),
  CONSTRAINT newsletter_subscribers_confirmation_check CHECK (confirmation_status IN ('PENDING','SENT','FAILED'))
);

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) UNIQUE NOT NULL,
  descriptor varchar(120) NOT NULL DEFAULT '',
  website_url text,
  logo_url text,
  icon varchar(40) NOT NULL DEFAULT 'building',
  status varchar(20) NOT NULL DEFAULT 'PUBLISHED',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partners_status_check CHECK (status IN ('PUBLISHED','DRAFT','INACTIVE'))
);

INSERT INTO partners(name,descriptor,icon,status,display_order) VALUES
  ('TechWave','SOLUTIONS','layers','PUBLISHED',1),
  ('CloudPeak','SYSTEMS','cloud','PUBLISHED',2),
  ('DataCore','ANALYTICS','data','PUBLISHED',3),
  ('NextGen','DIGITAL','network','PUBLISHED',4),
  ('ByteFlow','TECHNOLOGIES','hexagon','PUBLISHED',5),
  ('SoftNova','SOLUTIONS','badge','PUBLISHED',6)
ON CONFLICT (name) DO NOTHING;

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
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug varchar(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category varchar(100) NOT NULL DEFAULT 'Web Development';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress smallint NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_result varchar(160) NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS theme varchar(30) NOT NULL DEFAULT 'analytics';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique_idx ON projects(lower(slug)) WHERE slug IS NOT NULL;
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_progress_check CHECK (progress BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS projects_status_created_idx ON projects(status,created_at DESC);
CREATE INDEX IF NOT EXISTS services_public_order_idx ON services(status,display_order,created_at);
CREATE INDEX IF NOT EXISTS products_status_created_idx ON products(status,created_at DESC);
CREATE INDEX IF NOT EXISTS products_public_order_idx ON products(status,is_featured,display_order,created_at DESC);
CREATE INDEX IF NOT EXISTS pricing_plans_public_order_idx ON pricing_plans(status,display_order,created_at);
CREATE INDEX IF NOT EXISTS blog_posts_status_created_idx ON blog_posts(status,created_at DESC);
CREATE INDEX IF NOT EXISTS testimonials_public_order_idx ON testimonials(status,is_featured,display_order,created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx ON contact_messages(status,created_at DESC);
CREATE INDEX IF NOT EXISTS contact_message_replies_message_idx ON contact_message_replies(message_id,created_at);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status,subscribed_at DESC);
CREATE INDEX IF NOT EXISTS partners_public_order_idx ON partners(status,display_order,created_at);
CREATE INDEX IF NOT EXISTS clients_status_created_idx ON clients(status,created_at DESC);
CREATE INDEX IF NOT EXISTS clients_industry_idx ON clients(industry);
CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_public_idx ON projects(is_published,is_featured,created_at DESC);
