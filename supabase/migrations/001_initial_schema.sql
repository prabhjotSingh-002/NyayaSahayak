-- Initial Schema Migration for NyayaSahayak Database

-- Users profile synced from authentication provider
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Case records management
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_title TEXT NOT NULL,
  case_number TEXT,
  case_type TEXT NOT NULL,
  court_name TEXT,
  court_type TEXT,
  judge_name TEXT,
  petitioner TEXT,
  respondent TEXT,
  filing_date DATE,
  next_hearing_date DATE,
  current_status TEXT DEFAULT 'active',
  ai_context_summary TEXT,
  case_strength_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded documents metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  page_count INT,
  doc_type TEXT NOT NULL,
  doc_category TEXT,
  extracted_text TEXT,
  overall_risk_score DECIMAL(3,2),
  analysis_status TEXT DEFAULT 'pending',
  hearing_date DATE,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contract clauses analysis results
CREATE TABLE clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  clause_type TEXT NOT NULL,
  clause_text TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score DECIMAL(3,2),
  explanation TEXT,
  talking_points JSONB DEFAULT '[]'::jsonb,
  standard_practice TEXT,
  relevant_law TEXT,
  law_section TEXT,
  case_law_citation TEXT,
  page_number INT,
  start_char INT,
  end_char INT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Case hearings log
CREATE TABLE hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  hearing_number INT,
  court_order_summary TEXT,
  next_date DATE,
  judge_remarks TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chat conversation threads
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages inside conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Chunks segmented from uploaded documents
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(384),
  page_number INT,
  token_count INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for vector cosine distance
CREATE INDEX ON document_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text search column and index
ALTER TABLE document_chunks ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED;
CREATE INDEX ON document_chunks USING gin(fts);

-- Pre-loaded legal database chunks
CREATE TABLE legal_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(384),
  source_type TEXT NOT NULL,
  source_name TEXT,
  section TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON legal_knowledge 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE legal_knowledge ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX ON legal_knowledge USING gin(fts);

-- Vector similarity search scoped to user/case
CREATE OR REPLACE FUNCTION vector_search(
    query_embedding vector(384),
    match_count INT,
    p_user_id UUID,
    p_case_id UUID DEFAULT NULL,
    p_doc_id UUID DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_text TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.user_id = p_user_id
      AND (p_case_id IS NULL OR d.case_id = p_case_id)
      AND (p_doc_id IS NULL OR d.id = p_doc_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Full-text search scoped to user/case
CREATE OR REPLACE FUNCTION fts_search(
    query_text TEXT,
    match_count INT,
    p_user_id UUID,
    p_case_id UUID DEFAULT NULL,
    p_doc_id UUID DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_text TEXT,
    rank FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_text,
        ts_rank(dc.fts, plainto_tsquery('english', query_text)) AS rank
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.user_id = p_user_id
      AND (p_case_id IS NULL OR d.case_id = p_case_id)
      AND (p_doc_id IS NULL OR d.id = p_doc_id)
      AND dc.fts @@ plainto_tsquery('english', query_text)
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Vector similarity search for global legal knowledge base
CREATE OR REPLACE FUNCTION vector_search_knowledge(query_embedding vector(384), match_count INT)
RETURNS TABLE (id UUID, content TEXT, source_name TEXT, section TEXT, similarity FLOAT)
AS $$
  SELECT id, content, source_name, section, 1 - (embedding <=> query_embedding) AS similarity
  FROM legal_knowledge
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE SQL;