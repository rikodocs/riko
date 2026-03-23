-- ============================================
-- RIKO - Migration V3: Add manual_review status
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Update the CHECK constraint to allow 'manual_review' status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('pending', 'consulted', 'used', 'error', 'duplicate', 'manual_review'));

-- Create index for faster filtering of manual_review docs
CREATE INDEX IF NOT EXISTS idx_documents_manual_review ON documents(status) WHERE status = 'manual_review';
