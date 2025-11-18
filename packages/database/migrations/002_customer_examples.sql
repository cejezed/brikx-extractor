-- Migration 002: Customer Examples for Jules Training
-- Training data extraction system for LLM training

-- customer_examples table
-- Stores training examples extracted from PvE documents for Jules LLM
CREATE TABLE customer_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source project reference
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Multi-tenant support
  workspace_id UUID,  -- FK to workspaces table (prepared for future)

  -- Example type (Type A or Type B)
  example_type TEXT NOT NULL CHECK (example_type IN ('DIRECT_ACTIONABLE', 'EMOTIONAL_SIGNAL')),

  -- The actual training example data (polymorphic)
  -- For DIRECT_ACTIONABLE:
  --   { userInput, interpretation, suggestedPatches, confidence, relevantChapters }
  -- For EMOTIONAL_SIGNAL:
  --   { userInput, signalType, emotionalCategory, interpretedIntent, designImplication, followupStrategy }
  example_data JSONB NOT NULL,

  -- Approval workflow
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  -- AI-generated quality score (0.0 - 1.0)
  quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),

  -- User-defined tags for filtering/searching
  tags TEXT[] DEFAULT '{}',

  -- Batch tracking (for grouping examples extracted together)
  extraction_batch TEXT NOT NULL,

  -- Review tracking
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,  -- FK to auth.users
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customer_examples_project ON customer_examples(project_id);
CREATE INDEX idx_customer_examples_workspace ON customer_examples(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_customer_examples_type ON customer_examples(example_type);
CREATE INDEX idx_customer_examples_status ON customer_examples(status);
CREATE INDEX idx_customer_examples_quality ON customer_examples(quality_score DESC);
CREATE INDEX idx_customer_examples_batch ON customer_examples(extraction_batch);
CREATE INDEX idx_customer_examples_tags ON customer_examples USING GIN(tags);
CREATE INDEX idx_customer_examples_created_at ON customer_examples(created_at DESC);

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_customer_examples_updated_at
  BEFORE UPDATE ON customer_examples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE customer_examples ENABLE ROW LEVEL SECURITY;

-- Development policy: Allow all operations (to be restricted later with auth)
CREATE POLICY "Allow all for development" ON customer_examples FOR ALL USING (true);

-- Feature flag for customer example extraction
INSERT INTO feature_flags (flag_name, enabled, description, config) VALUES
  ('customer_examples_enabled', true, 'Enable customer example extraction for Jules training', '{
    "minQualityScore": 0.6,
    "maxExamplesPerProject": 30,
    "autoApproveThreshold": 0.9
  }'::jsonb);

-- Comments for documentation
COMMENT ON TABLE customer_examples IS 'Training examples for Jules LLM, extracted from PvE documents';
COMMENT ON COLUMN customer_examples.example_type IS 'Type A (DIRECT_ACTIONABLE) or Type B (EMOTIONAL_SIGNAL)';
COMMENT ON COLUMN customer_examples.example_data IS 'Polymorphic data: DirectActionableExample or EmotionalSignalExample';
COMMENT ON COLUMN customer_examples.quality_score IS 'AI-generated quality score (0.0 - 1.0), higher is better';
COMMENT ON COLUMN customer_examples.extraction_batch IS 'Batch ID for grouping examples extracted together';
