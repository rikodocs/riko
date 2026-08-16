-- ============================================
-- RIKO - Migration V4: Viewer users + document assignment
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS viewer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewer_users_code ON viewer_users(code);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES viewer_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_assigned_to ON documents(assigned_to);

ALTER TABLE viewer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on viewer_users" ON viewer_users FOR ALL USING (true) WITH CHECK (true);
