-- Migration 001: Initial Schema for PvE Analyzer
-- Aligned with @brikx/extractor-core types (ExtractResult, PatchEvent, CustomerExample, ClientSignal)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
-- Stores uploaded PvE documents and their extraction results
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File metadata
  filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,  -- Path in storage bucket

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'review', 'approved', 'exported', 'error')) DEFAULT 'uploading',

  -- Extraction results (aligned with @brikx/extractor-core types)
  -- These are JSONB columns storing exact TypeScript types
  customer_example JSONB,  -- CustomerExample type from core
  patches JSONB,           -- PatchEvent[] - ONLY 'set' | 'append' | 'remove'
  original_text TEXT,      -- Raw extracted text from document

  -- Metadata (from ExtractMeta type)
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  warnings TEXT[],

  -- Review tracking
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,  -- FK to auth.users (Supabase auth)

  -- Manual edits tracking (structured as per requirement)
  -- Format: [{ fieldPath, oldValue, newValue, editedAt, editedBy }]
  manual_edits JSONB DEFAULT '[]'::jsonb,

  -- Export tracking
  exported_at TIMESTAMPTZ,
  export_response JSONB,  -- Response from Brikx API

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Multi-tenant support (prepared for future)
  workspace_id UUID,  -- FK to workspaces table (to be created)
  created_by UUID     -- FK to auth.users
);

-- Indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_workspace ON projects(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_projects_created_by ON projects(created_by) WHERE created_by IS NOT NULL;

-- document_chunks table
-- Stores text chunks with bounding boxes for PDF highlighting
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Document position
  page_number INT NOT NULL,
  chunk_index INT NOT NULL,

  -- Content
  text_content TEXT NOT NULL,

  -- Bounding box (for PDF highlighting)
  -- Format: { x, y, width, height, pageWidth, pageHeight }
  bbox JSONB,

  -- Link to extracted field
  extracted_field TEXT,  -- e.g., 'coreData.budget', 'wishes[0]', 'emotionalSignals[1]'
  field_type TEXT,       -- e.g., 'budget', 'wish', 'signal', 'location'

  -- Confidence for this chunk
  confidence DECIMAL(3,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique chunks per project
  UNIQUE(project_id, page_number, chunk_index)
);

CREATE INDEX idx_chunks_project ON document_chunks(project_id);
CREATE INDEX idx_chunks_field ON document_chunks(extracted_field) WHERE extracted_field IS NOT NULL;

-- ai_suggestions table
-- Stores AI-generated suggestions for review
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Suggestion metadata
  suggestion_type TEXT NOT NULL,  -- 'missed_wish', 'budget_clarification', 'location_suggestion', etc.

  -- Suggestion content
  -- Format depends on type, but always includes:
  -- { field, suggestedValue, reason, sourceQuote?, confidence? }
  content JSONB NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_applied')) DEFAULT 'pending',

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,  -- FK to auth.users

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- AI model metadata
  model_name TEXT,     -- e.g., 'claude-3-5-sonnet-20241022'
  model_version TEXT
);

CREATE INDEX idx_suggestions_project ON ai_suggestions(project_id);
CREATE INDEX idx_suggestions_status ON ai_suggestions(status);

-- feature_flags table
-- Control features like Brikx export
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- Configuration for this flag
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, enabled, description, config) VALUES
  ('brikx_export', false, 'Enable export to Brikx API', '{"apiUrl": "", "apiKey": ""}'::jsonb),
  ('ai_extraction', true, 'Enable AI-powered extraction with Claude', '{"model": "claude-3-5-sonnet-20241022"}'::jsonb),
  ('pdf_highlighting', true, 'Enable PDF text highlighting in review UI', '{}'::jsonb),
  ('multi_tenant', false, 'Enable multi-workspace support', '{}'::jsonb);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger: Auto-update updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on feature_flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (prepared for multi-tenant, currently permissive for development)

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Development policy: Allow all operations (to be restricted later with auth)
CREATE POLICY "Allow all for development" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON ai_suggestions FOR ALL USING (true);

-- Feature flags: Read-only for non-admins (to be implemented)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for all" ON feature_flags FOR SELECT USING (true);

-- Comments for documentation
COMMENT ON TABLE projects IS 'PvE documents and their extraction results. All extraction data uses types from @brikx/extractor-core.';
COMMENT ON COLUMN projects.customer_example IS 'CustomerExample type: { coreData, wishes, emotionalSignals }';
COMMENT ON COLUMN projects.patches IS 'PatchEvent[] type - ONLY operations: set | append | remove';
COMMENT ON COLUMN projects.manual_edits IS 'Structured edits: [{ fieldPath, oldValue, newValue, editedAt, editedBy }]';
COMMENT ON TABLE document_chunks IS 'Text chunks with bounding boxes for PDF source highlighting';
COMMENT ON TABLE ai_suggestions IS 'AI-generated suggestions during extraction for human review';
COMMENT ON TABLE feature_flags IS 'Feature toggles for controlling functionality (e.g., Brikx export)';
