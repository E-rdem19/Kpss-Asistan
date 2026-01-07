-- ALTERNATIVE FIX: Simpler RLS Policies
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: Drop ALL existing policies
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

-- Step 2: Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLIFIED policies for profiles
-- Allow authenticated users to do everything with their own profile
CREATE POLICY "Enable all for users based on user_id"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Create policies for study_schedules
CREATE POLICY "Enable all for users based on user_id"
  ON study_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 6: Create policies for question_sessions
CREATE POLICY "Enable all for users based on user_id"
  ON question_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 7: Verify policies were created
-- You should see one policy per table
