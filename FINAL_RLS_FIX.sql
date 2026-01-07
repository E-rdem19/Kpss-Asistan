-- FINAL FIX: Drop all policies and recreate cleanly
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL policies (ignore errors if they don't exist)
DO $$ 
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS "Enable all for users based on user_id" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    
    -- Drop study_schedules policies
    DROP POLICY IF EXISTS "Enable all for users based on user_id" ON study_schedules;
    DROP POLICY IF EXISTS "Users can view own schedules" ON study_schedules;
    DROP POLICY IF EXISTS "Users can insert own schedules" ON study_schedules;
    DROP POLICY IF EXISTS "Users can update own schedules" ON study_schedules;
    DROP POLICY IF EXISTS "Users can delete own schedules" ON study_schedules;
    
    -- Drop question_sessions policies
    DROP POLICY IF EXISTS "Enable all for users based on user_id" ON question_sessions;
    DROP POLICY IF EXISTS "Users can view own sessions" ON question_sessions;
    DROP POLICY IF EXISTS "Users can insert own sessions" ON question_sessions;
    DROP POLICY IF EXISTS "Users can update own sessions" ON question_sessions;
    DROP POLICY IF EXISTS "Users can delete own sessions" ON question_sessions;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies
CREATE POLICY "profiles_policy"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "schedules_policy"
  ON study_schedules
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_policy"
  ON question_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Done! Now verify:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'study_schedules', 'question_sessions');
