-- ============================================
-- RIKO - Schema do Supabase
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Tabela de configurações (API URL e Token)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  api_url TEXT,
  api_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir registro padrão
INSERT INTO settings (id, api_url, api_token) VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

-- Tabela de pessoas (dados consultados)
CREATE TABLE IF NOT EXISTS people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT UNIQUE NOT NULL,
  name TEXT,
  birth_date TEXT,
  mother_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  score TEXT,
  income TEXT,
  raw_data JSONB,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice no CPF para busca rápida de duplicados
CREATE INDEX IF NOT EXISTS idx_people_cpf ON people(cpf);
CREATE INDEX IF NOT EXISTS idx_people_used ON people(used);

-- Tabela de documentos importados
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'consulted', 'used', 'error', 'duplicate')),
  cpf_extracted TEXT,
  extracted_text TEXT,
  person_id UUID REFERENCES people(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_person_id ON documents(person_id);

-- ============================================
-- RLS (Row Level Security) - Desabilitar para acesso pelo service role
-- Se quiser proteger, habilite RLS e crie policies
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies para permitir tudo (o app usa service_role no backend e anon no frontend)
-- Frontend precisa ler/escrever via anon key
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on people" ON people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Storage Bucket para documentos
-- Crie manualmente no Supabase Dashboard:
-- 1. Vá em Storage > New Bucket
-- 2. Nome: "documents"
-- 3. Marque como "Public" (para o app poder ler as URLs)
-- ============================================
