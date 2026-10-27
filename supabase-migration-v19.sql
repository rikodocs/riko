-- ============================================
-- RIKO - Migration V19: Scanner de CNH Digital (QR code)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Categoria do documento: cnh_digital ou outro
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_category TEXT;
CREATE INDEX IF NOT EXISTS idx_documents_doc_category ON documents(doc_category);

-- Dados do QR code extraído (URL ou texto)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS qr_data TEXT;
