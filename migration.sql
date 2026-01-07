-- KPSS Study Tracking System - Feature Extension Migration
-- Run this in Supabase SQL Editor after the initial schema
-- Date: 2026-01-07

-- ==============================================
-- 1. ADD DURATION COLUMN TO QUESTION_SESSIONS
-- ==============================================

-- Add duration_minutes to track total study time per session
ALTER TABLE question_sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN question_sessions.duration_minutes IS 'Total study duration in minutes for this session';

-- ==============================================
-- 2. CREATE STUDY_TIMERS TABLE
-- ==============================================

-- Table to track individual timer sessions
CREATE TABLE IF NOT EXISTS study_timers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES question_sessions ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  pause_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'paused', 'stopped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add comments
COMMENT ON TABLE study_timers IS 'Tracks study session timers with start/pause/stop functionality';
COMMENT ON COLUMN study_timers.session_id IS 'Optional link to question_sessions table';
COMMENT ON COLUMN study_timers.duration_seconds IS 'Total elapsed time in seconds (excluding paused time)';

-- Enable RLS
ALTER TABLE study_timers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_timers
CREATE POLICY "Users can view own timers"
  ON study_timers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timers"
  ON study_timers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timers"
  ON study_timers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timers"
  ON study_timers FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_study_timers_user_date ON study_timers(user_id, created_at DESC);
CREATE INDEX idx_study_timers_session ON study_timers(session_id) WHERE session_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_study_timers_updated_at BEFORE UPDATE ON study_timers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 3. CREATE MOCK_EXAMS TABLE
-- ==============================================

-- Table to track mock exam results
CREATE TABLE IF NOT EXISTS mock_exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exam_date DATE NOT NULL,
  exam_name TEXT,
  sections JSONB NOT NULL, -- Array of {subject, correct, wrong, net_score}
  total_net_score NUMERIC(6,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add comments
COMMENT ON TABLE mock_exams IS 'Stores mock exam results with auto-calculated net scores';
COMMENT ON COLUMN mock_exams.sections IS 'JSON array of section objects with subject, correct, wrong, and net_score';
COMMENT ON COLUMN mock_exams.total_net_score IS 'Sum of all section net scores (correct - wrong/4)';

-- Enable RLS
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_exams
CREATE POLICY "Users can view own exams"
  ON mock_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams"
  ON mock_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
  ON mock_exams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
  ON mock_exams FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_mock_exams_user_date ON mock_exams(user_id, exam_date DESC);
CREATE INDEX idx_mock_exams_user_created ON mock_exams(user_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_mock_exams_updated_at BEFORE UPDATE ON mock_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 4. HELPER FUNCTIONS
-- ==============================================

-- Function to calculate net score
CREATE OR REPLACE FUNCTION calculate_net_score(correct INTEGER, wrong INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  RETURN correct - (wrong::NUMERIC / 4.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_net_score IS 'Calculates KPSS net score: correct - (wrong / 4)';

-- ==============================================
-- 5. VERIFICATION QUERIES
-- ==============================================

-- Uncomment to verify after running migration:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('study_timers', 'mock_exams');

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'question_sessions' 
-- AND column_name = 'duration_minutes';
