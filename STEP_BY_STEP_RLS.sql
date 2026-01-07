-- ADIM ADIM RLS KURULUMU
-- Eğer RLS kapalıyken çalıştıysa, bu scripti çalıştırın

-- 1. RLS'i tekrar aç
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- 2. SADECE profiles için basit bir politika oluştur (TEST)
CREATE POLICY "test_profiles_policy"
  ON profiles
  FOR ALL
  TO public  -- Herkes erişebilir (sadece test için)
  USING (true)
  WITH CHECK (true);

-- ŞİMDİ TEKRAR PROFIL OLUŞTURMAYI DENEYİN
-- Eğer HALA çalışmıyorsa, sorun başka bir yerde
-- Eğer çalışıyorsa, politikayı daha güvenli hale getirelim:

-- 3. Test politikasını sil ve gerçek politikayı oluştur
DROP POLICY IF EXISTS "test_profiles_policy" ON profiles;

CREATE POLICY "secure_profiles_policy"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Diğer tablolar için de politika ekle
CREATE POLICY "secure_schedules_policy"
  ON study_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_sessions_policy"
  ON question_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Doğrula
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('profiles', 'study_schedules', 'question_sessions');
