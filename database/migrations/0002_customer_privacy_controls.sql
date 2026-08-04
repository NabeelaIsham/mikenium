ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token_hash char(64);
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_unsubscribe_token_unique
  ON newsletter_subscribers(unsubscribe_token_hash) WHERE unsubscribe_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS newsletter_confirmation_expiry_idx ON newsletter_subscribers(confirmation_expires_at);
CREATE INDEX IF NOT EXISTS contact_messages_retention_idx ON contact_messages(status,created_at);
CREATE INDEX IF NOT EXISTS audit_logs_retention_idx ON admin_audit_logs(created_at);
