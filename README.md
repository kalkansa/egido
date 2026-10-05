# Egido – Eğitim Oyunları

Öğretmenin soru hazırladığı, öğrencilerin kodla katıldığı, skorların sınıf bazında
listelendiği tarayıcı oyunları. Sunucu kodu yok: sayfalar GitHub Pages'ta statik durur,
veriler Supabase (PostgreSQL + Auth) üzerinde.

Canlı adres: `https://kalkansa.github.io/egido/`

## Akış

- **Öğretmen** ana sayfadan kullanıcı adı + şifre ile girer (hesabı yönetici açar), bir oyun türü
  seçer, soruları yazar, **Kaydet** der. Oyun 5 harfli bir kod alır (örn. `KALE7`).
  **Öğrenci Kodu Oluştur** paneli kodu, QR'ı ve kısa bağlantıyı gösterir; **Tam Ekran Göster** tahtaya yansıtılır.
- **Öğrenci** giriş yapmaz. QR okutur ya da `kalkansa.github.io/egido` adresine girip kodu yazar,
  adını ve sınıfını yazar, oynar. Skoru sınıfın ortak tablosuna düşer.
- Öğretmen panelinde kayıtlı oyunlar listelenir: kodu göster, düzenle, sil.

## Oyunlar

| Oyun | Yol | Açıklama |
|------|-----|----------|
| 🎈 Balon Patlat | `games/balon/` | Doğru cevaplı balonları patlat, yanlışlara dokunma |
| 🧩 Harf Puzzle | `games/puzzle/` | Resme bak, karışık harf parçalarını dizip kelimeyi yaz |
| ⚽ Gol Vuruşu | `games/gol/` | Yolda yuvarlanan toplardan doğru cevaplıya vur, gol at; yanlışta kaleci kurtarır ya da top dışarı gider |
| 🔌 Kablo Eşleştirme | `games/kablo/` | Resmi doğru kelimeye kabloyla bağla; doğruysa lamba yanar, yanlışsa kısa devre |
| 📝 Cümle Kur | `games/cumle/` | Karışık kelimeleri okul fişi üzerinde doğru sıraya diz |

## Klasör yapısı

```
index.html            Ana sayfa: öğrenci kod girişi + öğretmen girişi + öğretmen paneli
shared/config.js      Supabase URL ve anon key (tek yer)
shared/egido.css      Ortak stil
shared/egido.js       Ortak çekirdek: giriş, kaydet, kod/QR, skor tablosu, Supabase, sesler
supabase/schema.sql   Tablolar, RLS kuralları, join_set fonksiyonu
games/<oyun>/         Her oyun kendi klasöründe, tek index.html
```

## Kurulum

### 1. Supabase

1. [supabase.com](https://supabase.com) → **Sign in with GitHub** → **New project**. Bölge: **Frankfurt**.
2. **SQL Editor → New query**: `supabase/schema.sql` dosyasının tamamını yapıştırıp **Run**.
3. **Authentication → Providers → Email**: açık olsun. Öğretmenler kendi kendine kayıt olmayacağı için
   **Authentication → Sign In / Up** altında *Allow new users to sign up* seçeneğini **kapatın**.
   *Confirm email* da kapalı olsun (hesapları siz açacaksınız).
4. **Project Settings → API**: **Project URL** ve **anon public** anahtarını `shared/config.js` içine yazın, push edin.

anon anahtarının tarayıcıda görünmesi normaldir; güvenlik `schema.sql` içindeki Row Level Security
kurallarıyla sağlanır. Öğrenci (anon) yalnızca skor ekleyip okuyabilir ve `join_set(kod)` ile tek bir
oyunu çekebilir. Öğretmen yalnızca kendi oyunlarını görür ve değiştirir.

### 2. Öğretmen hesabı açma

Supabase panelinde **Authentication → Users → Add user → Create new user**:

- Email: `kullaniciadi@egido.local` (öğretmen giriş ekranına sadece `kullaniciadi` yazar; `@egido.local` otomatik eklenir)
- Password: belirlediğiniz şifre
- **Auto Confirm User** işaretli

Alan adını değiştirmek isterseniz `shared/config.js` içindeki `userDomain` değerini değiştirin.

### 3. Pixabay (resim arama, isteğe bağlı)

Harf Puzzle ve Kablo Eşleştirme'de resim seçici "Pixabay'de Ara" sekmesi içerir. Çalışması için ücretsiz anahtar:
[pixabay.com](https://pixabay.com) → hesap aç → [API sayfası](https://pixabay.com/api/docs/) → anahtarı kopyala → `shared/config.js` içine `pixabayKey` olarak yaz.
Arama arayüz dilinde yapılır, güvenli arama açıktır; seçilen resim küçültülüp oyuna gömülür (Pixabay kalıcı hotlink istemez).

### 4. GitHub Pages

Depo **public** olmalı (ücretsiz planda Pages yalnızca public depolarda çalışır).
**Settings → Pages → Build and deployment**: Deploy from a branch, **main**, **/ (root)**.

## Skor tablosu

- Her kayıtlı oyun için anahtar: oyun kimliği + soru seti özeti + oturum kimliği (`sid`).
- Aynı öğrencinin (ad + sınıf) yalnızca en iyi skoru listelenir; sınıfa göre filtre var.
- **Yeni Tablo Başlat** eski skorları silmez, yeni bir oturum kimliği üretir. Kod aynı kalır.
- `shared/config.js` boşsa (yerel mod) skorlar yalnızca o tarayıcıda tutulur, kod üretilemez, ayarlar
  uzun bağlantının içinde taşınır.

## Temizlik

Öğretmen panelinde her oyunun **Son oynanma** tarihi görünür; 60 günden eskiler uyarı rengiyle işaretlenir.
Toplu temizlik için Supabase SQL Editor'da:

```sql
-- 90 gündür oynanmayan (ya da hiç oynanmamış ve 90 günden eski) oyunları sil
delete from public.sets where coalesce(last_played_at, created_at) < now() - interval '90 days';
-- Eski skorları sil
delete from public.scores where created_at < now() - interval '90 days';
```

## Yeni oyun ekleme

1. `games/<yeni>/index.html` oluşturun; `games/puzzle/index.html` iyi bir şablondur.
2. `#setup` kartında şunlar bulunsun: `#teacherBarHost`, `#btnStart`, `#btnShare`, `#btnLbSetup`, `#setupErr`, `#sharePanelHost`.
   Bir `#game` ekranı ve isteğe bağlı `#countdown` olsun.
3. `Egido.init({ gameId, gameName, emoji, introRules, readConfig, writeConfig, validate, summary, startGame })` çağırın;
   oyun bitince `Egido.finish({...})`.
4. `index.html` içindeki `GAMES` listesine oyunu ekleyin.
