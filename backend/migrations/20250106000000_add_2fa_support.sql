-- Add 2FA support columns to users table
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;

-- Create index on totp_enabled for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_totp_enabled ON users(totp_enabled);
