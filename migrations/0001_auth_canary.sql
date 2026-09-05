CREATE TABLE IF NOT EXISTS invited_accounts (
  account_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  provider TEXT NOT NULL DEFAULT 'google',
  issuer TEXT,
  subject TEXT,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS invited_accounts_provider_subject_unique
  ON invited_accounts(provider, issuer, subject)
  WHERE issuer IS NOT NULL AND subject IS NOT NULL;

CREATE INDEX IF NOT EXISTS invited_accounts_enabled_email_idx
  ON invited_accounts(enabled, email);
