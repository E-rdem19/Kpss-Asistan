-- KPSS Study Supervision Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  exam_type TEXT NOT NULL,
  daily_study_minutes INTEGER NOT NULL,
  target_score INTEGER NOT NULL,
  weekly_study_days TEXT[] NOT NULL, -- Array of day names: ['Monday', 'Tuesday', ...]
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Study schedules table
CREATE TABLE IF NOT EXISTS study_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_questions INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'done', 'skipped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Question sessions table
CREATE TABLE IF NOT EXISTS question_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  solved INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  incorrect INTEGER NOT NULL,
  blank INTEGER NOT NULL,
  wrong_question_ids TEXT, -- Comma-separated IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own schedules" ON study_schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON study_schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON study_schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON study_schedules;

DROP POLICY IF EXISTS "Users can view own sessions" ON question_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON question_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON question_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON question_sessions;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for study_schedules
CREATE POLICY "Users can view own schedules"
  ON study_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
  ON study_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON study_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON study_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for question_sessions
CREATE POLICY "Users can view own sessions"
  ON question_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON question_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON question_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON question_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_study_schedules_user_date ON study_schedules(user_id, date);
CREATE INDEX idx_question_sessions_user_created ON question_sessions(user_id, created_at DESC);
CREATE INDEX idx_question_sessions_topic ON question_sessions(user_id, subject, topic);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_schedules_updated_at BEFORE UPDATE ON study_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
