-- TÜM SORUNLARI ÇÖZEN SCRIPT
-- Supabase SQL Editor'da bu scriptin TAMAMINI çalıştırın

-- Adım 1: Tüm mevcut politikaları temizle
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('profiles', 'study_schedules', 'question_sessions'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Adım 2: RLS'i kapat ve tekrar aç
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- Adım 3: Basit ve çalışan politikalar
CREATE POLICY "profiles_all_access"
  ON profiles
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "schedules_all_access"
  ON study_schedules
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_all_access"
  ON question_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Adım 4: Kontrol et (3 politika görmelisiniz)
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'study_schedules', 'question_sessions')
ORDER BY tablename;
