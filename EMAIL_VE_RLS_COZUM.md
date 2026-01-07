# Email Doğrulama ve RLS Sorunlarının Çözümü

## Sorun 1: Email Doğrulama Hatası

Supabase varsayılan olarak email doğrulaması istiyor. Bunu kapatmalıyız.

### Adımlar:

1. **Supabase Dashboard'a git**
2. **Authentication** → **Providers** → **Email** sekmesine git
3. **"Confirm email"** ayarını **KAPAT** (disable)
4. **Save** butonuna tıkla

![Email confirmation ayarı](https://supabase.com/docs/_next/image?url=%2Fdocs%2Fimg%2Fguides%2Fauth%2Fauth-confirm-email.png&w=1920&q=75)

## Sorun 2: RLS Politikası

### Doğru RLS Kurulumu:

Supabase SQL Editor'da şunu çalıştır:

```sql
-- 1. Önce tüm politikaları temizle
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

-- 2. RLS'i kapat ve tekrar aç (temiz başlangıç)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Basit ve çalışan politikalar oluştur
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
```

## Sorun 3: Profil Zaten Var

Eğer profil zaten oluşturulduysa, tekrar kayıt olma. Bunun yerine:

1. Çıkış yap
2. Aynı email ile **GİRİŞ YAP** (Sign In)
3. Profil zaten var olduğu için direkt anasayfaya gidecek

## Test Adımları:

1. ✅ Email confirmation'ı kapat (yukarıdaki adımlar)
2. ✅ RLS SQL'ini çalıştır
3. ✅ Uygulamada çıkış yap
4. ✅ Tekrar giriş yap (aynı email/şifre)
5. ✅ Anasayfaya gitmelisiniz

## Hala Sorun Varsa:

RLS'i tamamen kapat (sadece test için):
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;
```

Production'a geçmeden önce RLS'i tekrar açarız.
