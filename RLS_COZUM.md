# RLS Sorunu Çözümü - Detaylı Adımlar

## Sorun
"new row violates row-level security policy for table 'profiles'" hatası alıyorsunuz.

## Çözüm 1: Basitleştirilmiş RLS Politikaları (ÖNERİLEN)

### Adım 1: Supabase Dashboard'a Git
1. https://supabase.com/dashboard açın
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin

### Adım 2: Bu SQL'i Çalıştır
`SIMPLE_RLS_FIX.sql` dosyasının TAMAMINI kopyalayıp SQL Editor'a yapıştırın ve **Run** yapın.

### Adım 3: Politikaları Kontrol Et
1. Sol menüden **Database** → **Tables** seçin
2. `profiles` tablosuna tıklayın
3. **Policies** sekmesine gidin
4. "Enable all for users based on user_id" adında bir politika görmeli siniz

### Adım 4: Test Et
1. Tarayıcıda http://localhost:5173 açın
2. F12 → Console sekmesini açın (hataları görmek için)
3. Yeni bir hesap oluşturun
4. Console'da ne yazdığını kontrol edin

---

## Çözüm 2: RLS'i Geçici Olarak Kapat (Test için)

Eğer hala çalışmıyorsa, RLS'i tamamen kapatarak test edin:

```sql
-- Supabase SQL Editor'da çalıştırın
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions DISABLE ROW LEVEL SECURITY;
```

Şimdi profil oluşturmayı deneyin. Eğer çalışırsa, sorun kesinlikle RLS politikalarında.

**ÖNEMLİ:** RLS'i tekrar açmayı unutmayın:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sessions ENABLE ROW LEVEL SECURITY;
```

Sonra `SIMPLE_RLS_FIX.sql` dosyasını tekrar çalıştırın.

---

## Çözüm 3: Manual Insert ile Test

Supabase SQL Editor'da manuel insert deneyin:

```sql
-- Önce mevcut user ID'nizi bulun
SELECT id, email FROM auth.users;

-- Sonra (kendi user ID'nizi kullanarak):
INSERT INTO profiles (id, exam_type, daily_study_minutes, target_score, weekly_study_days, start_date)
VALUES 
  ('YOUR-USER-ID-HERE', 'KPSS Önlisans', 240, 80, ARRAY['Pazartesi', 'Salı'], '2026-01-07');
```

Eğer bu çalışırsa, sorun frontend kodunda.
Eğer bu da hata verirse, sorun RLS politikasında.

---

## Console Çıktısına Bakın

Güncellenmiş kod artık detaylı hata mesajları veriyor. Tarayıcı console'unda (F12) şunları göreceksiniz:
- User ID
- Form data
- Session bilgisi
- Insert sonucu
- Detaylı hata mesajları

Bu bilgileri bana gönderin, daha spesifik çözüm bulalım.

---

## Sık Karşılaşılan Sorunlar

### 1. "JWT expired" hatası
**Çözüm:** Çıkış yapıp tekrar giriş yapın

### 2. "auth.uid() is null"
**Çözüm:** Session kontrolü ekledim, şimdi daha iyi hata mesajı verecek

### 3. "relation does not exist"
**Çözüm:** `supabase-schema.sql` dosyasını tekrar çalıştırın

### 4. Hiçbir hata görmüyorum
**Çözüm:** Tarayıcı console'u açık olduğundan emin olun (F12)
