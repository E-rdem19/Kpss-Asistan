-- GEÇICI TEST: RLS'i Tamamen Kapat
-- Bu sadece TEST için. Eğer bu çalışırsa, sorun RLS politikalarında demektir.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;

-- ŞİMDİ PROFIL OLUŞTURMAYI DENEYİN!
-- Eğer çalışırsa, aşağıdaki adımlara geçin:
