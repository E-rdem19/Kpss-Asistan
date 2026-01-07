# KPSS Asistan - Akıllı Sınav Hazırlık Platformu

Tam özellikli bir KPSS sınav hazırlık web uygulaması. Supabase backend ile günlük çalışma planları, soru takibi, performans analizi ve yapay zeka destekli adaptif planlama özelliklerine sahiptir.

## 🎯 Özellikler

- ✅ **Kullanıcı Kayıt & Profil Yönetimi**
  - Supabase Auth ile güvenli giriş
  - Özelleştirilebilir profil (sınav türü, günlük çalışma süresi, hedef puan)
  
- 📅 **Çalışma Planlayıcı**
  - Günlük çalışma blokları oluşturma
  - Konu bazlı planlama
  - Durum takibi (bekliyor/tamamlandı/atlandı)
  
- ✏️ **Soru Takip Sistemi**
  - Çalışma seansı kaydetme
  - Doğru/yanlış/boş soru istatistikleri
  - Yanlış soru numaralarını kaydetme
  
- 📊 **Performans Analizi**
  - Konu bazında doğruluk oranları
  - Zayıf konu tespiti (%70 altı)
  - Interaktif grafikler (Recharts)
  - Sınav hazırlık puanı hesaplama
  
- 🤖 **Akıllı Adaptif Planlayıcı**
  - Performansa göre otomatik plan oluşturma
  - Zayıf konulara öncelik verme
  - Yük dengeleme analizi
  
- 📱 **Responsive Tasarım**
  - Mobil ve masaüstü uyumlu
  - Modern dark theme
  - Glassmorphism efektleri

## 🚀 Kurulum

### Ön Gereksinimler

- Node.js 16+ yüklü olmalı
- Bir Supabase hesabı ([supabase.com](https://supabase.com))

### Adım 1: Bağımlılıkları Yükleme

```bash
npm install
```

### Adım 2: Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. Yeni bir proje oluşturun
3. SQL Editor'a gidin
4. `supabase-schema.sql` dosyasının içeriğini kopyalayıp çalıştırın
5. Tüm tablolar ve RLS politikaları otomatik oluşacaktır

### Adım 3: Environment Değişkenlerini Ayarlama

`.env.local` dosyasını düzenleyin:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase bilgilerinizi almak için:
1. Supabase Dashboard > Settings > API
2. Project URL ve anon/public key'i kopyalayın

### Adım 4: Uygulamayı Çalıştırma

```bash
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine gidin.

## 📁 Proje Yapısı

```
kpss/
├── src/
│   ├── components/          # React bileşenleri
│   │   ├── Auth.jsx
│   │   ├── ProfileSetup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StudyPlanner.jsx
│   │   ├── QuestionTracker.jsx
│   │   ├── PerformanceAnalytics.jsx
│   │   └── AdaptivePlanner.jsx
│   ├── lib/                 # Yardımcı fonksiyonlar
│   │   ├── supabase.js      # Supabase istemcisi
│   │   ├── calculations.js   # Performans hesaplamaları
│   │   └── adaptivePlanner.js # Plan oluşturma algoritması
│   ├── App.jsx              # Ana uygulama
│   ├── main.jsx             # Giriş noktası
│   └── index.css            # Tasarım sistemi
├── supabase-schema.sql      # Veritabanı şeması
├── .env.local               # Environment değişkenleri (kendiniz doldurun)
├── index.html
├── package.json
└── vite.config.js
```

## 🗄️ Veritabanı Şeması

### Tablolar

- **profiles**: Kullanıcı profil bilgileri
- **study_schedules**: Çalışma takvimi blokları
- **question_sessions**: Soru çözüm seansları

Tüm tablolar Row Level Security (RLS) ile korunmaktadır.

## 🎨 Kullanım

### 1. Kayıt ve Profil Oluşturma

- İlk girişte email/şifre ile kayıt olun
- Profil ayarlarını (sınav türü, günlük çalışma süresi, hedef puan) girin

### 2. Çalışma Planı Oluşturma

- **Program** sayfasından manuel olarak çalışma blokları ekleyin
- Veya **Akıllı Plan** ile otomatik plan oluşturun

### 3. Soru Seansı Kaydetme

- **Soru Takibi** sayfasından çalışma seansınızı kaydedin
- Çözülen, doğru, yanlış, boş soru sayılarını girin

### 4. Performans İzleme

- **Analiz** sayfasından detaylı performans raporlarını görün
- Zayıf konularınızı tespit edin

### 5. Adaptif Planlama

- **Akıllı Plan** sayfasından performansınıza göre otomatik plan oluşturun
- Zayıf konularınıza otomatik öncelik verilir

## 🔧 Yapılandırma

### KPSS Ders ve Konuları Özelleştirme

`src/lib/adaptivePlanner.js` dosyasındaki `subjects` dizisini düzenleyerek ders ve konuları özelleştirebilirsiniz.

### Zayıf Konu Eşiği

`src/lib/calculations.js` dosyasındaki `detectWeakTopics` fonksiyonunda eşik değerini (varsayılan %70) değiştirebilirsiniz.

## 📊 Teknik Detaylar

### Teknoloji Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Grafik**: Recharts
- **Styling**: Vanilla CSS with CSS Variables
- **State Management**: React Hooks

### Performans Metrikleri

- **Hazırlık Puanı**: Çözülen soru sayısı (%40) + Doğruluk oranı (%40) + Zayıf konu penaltısı (%20)
- **Zayıf Konu**: %70'in altında doğruluk + en az 10 soru çözülmüş
- **Adaptif Planlama**: Zayıf konulara %50 zaman ayrılır

## 🚦 Durum Kodları

### Çalışma Bloğu Durumları
- `pending`: Bekliyor
- `done`: Tamamlandı
- `skipped`: Atlandı

## 🤝 Katkıda Bulunma

Bu proje MVP (Minimum Viable Product) olarak geliştirilmiştir. İyileştirme önerileri:

1. Gerçek zamanlı bildirimler
2. Mobil uygulama
3. PDF rapor oluşturma
4. Soru bankası entegrasyonu
5. Pomodoro timer entegrasyonu
6. Arkadaşlarla yarışma özelliği

## 📝 Lisans

Bu proje eğitim amaçlı oluşturulmuştur.

## 🆘 Destek

Sorularınız için:
- Supabase dokümantasyonu: [docs.supabase.com](https://docs.supabase.com)
- React dokümantasyonu: [react.dev](https://react.dev)

## ⚙️ Production Deployment

### Vercel'e Deploy

```bash
npm run build
# Vercel Dashboard'dan projeyi import edin
# Environment değişkenlerini ekleyin
```

### Netlify'a Deploy

```bash
npm run build
# dist/ klasörünü Netlify'a yükleyin
# Environment değişkenlerini ekleyin
```

---

**Not**: `.env.local` dosyasını asla Git'e eklemeyin. Bu dosya `.gitignore` içinde zaten var.
