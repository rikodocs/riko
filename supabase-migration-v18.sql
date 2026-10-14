-- ============================================
-- RIKO - Migration V18: Tipos de CNPJ
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Tabela de tipos (cnpj de adv, cnpj de blog, etc.)
CREATE TABLE IF NOT EXISTS cnpj_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cnpj_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on cnpj_types" ON cnpj_types FOR ALL USING (true) WITH CHECK (true);

-- Cada documento pode ter um tipo de CNPJ
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cnpj_type_id UUID REFERENCES cnpj_types(id);
CREATE INDEX IF NOT EXISTS idx_documents_cnpj_type ON documents(cnpj_type_id);

-- Cada operador pode ser atribuído a um tipo específico
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS cnpj_type_id UUID REFERENCES cnpj_types(id);
