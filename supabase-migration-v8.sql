-- ============================================
-- RIKO - Migration V8: Motivo da recusa (ex: CPF duplicado)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE document_reviews ADD COLUMN IF NOT EXISTS reason TEXT;
