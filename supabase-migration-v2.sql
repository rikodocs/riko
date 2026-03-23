-- ============================================
-- RIKO - Migração V2
-- Execute no SQL Editor do Supabase
-- Adiciona: múltiplos telefones, emails, endereços e profissão
-- ============================================

-- Adicionar novas colunas
ALTER TABLE people ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE people ADD COLUMN IF NOT EXISTS emails JSONB DEFAULT '[]'::jsonb;
ALTER TABLE people ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE people ADD COLUMN IF NOT EXISTS profession TEXT;

-- Migrar dados antigos (phone -> phones, email -> emails, address -> addresses)
UPDATE people SET phones = jsonb_build_array(phone) WHERE phone IS NOT NULL AND phone != '' AND (phones IS NULL OR phones = '[]'::jsonb);
UPDATE people SET emails = jsonb_build_array(email) WHERE email IS NOT NULL AND email != '' AND (emails IS NULL OR emails = '[]'::jsonb);
UPDATE people SET addresses = jsonb_build_array(address) WHERE address IS NOT NULL AND address != '' AND (addresses IS NULL OR addresses = '[]'::jsonb);

-- Remover colunas antigas (opcional - pode manter se quiser)
-- ALTER TABLE people DROP COLUMN IF EXISTS phone;
-- ALTER TABLE people DROP COLUMN IF EXISTS email;
-- ALTER TABLE people DROP COLUMN IF EXISTS address;
