-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  birthyear TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  provider TEXT NOT NULL CHECK (provider IN ('local', 'kakao')),
  kakao_id TEXT UNIQUE,
  password_hash TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone lookup
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_kakao_id ON users(kakao_id);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for phone+purpose lookup
CREATE INDEX idx_verification_phone_purpose ON verification_codes(phone, purpose);

-- Function to count daily verification codes
CREATE OR REPLACE FUNCTION get_daily_verification_count(p_phone TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM verification_codes
  WHERE phone = p_phone
    AND created_at > NOW() - INTERVAL '24 hours';
$$ LANGUAGE SQL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
