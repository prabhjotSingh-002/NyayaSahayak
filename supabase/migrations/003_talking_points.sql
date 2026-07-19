-- Migration 003: Add talking points & standard practices columns to clauses table

ALTER TABLE clauses ADD COLUMN IF NOT EXISTS talking_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clauses ADD COLUMN IF NOT EXISTS standard_practice TEXT;
