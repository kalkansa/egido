# Eğitim Oyunları

Öğretmenin soru ve cevapları yazdığı, öğrencilerin oynadığı, skorların sınıf bazında
listelendiği tarayıcı oyunları. Sunucu kodu yok: sayfalar GitHub Pages'ta statik durur,
skorlar Supabase (PostgreSQL) üzerine yazılır.

Canlı adres: `https://kalkansa.github.io/egido/`

## Oyunlar

| Oyun | Yol | Açıklama |
|------|-----|----------|
| 🎈 Balon Patlat | `games/balon/` | Doğru cevap yazan balonları patlat, yanlışlara dokunma |

## Klasör yapısı

```
index.html            Oyun listesi (ana sayfa)
shared/config.js      Ortak ayarlar: Supabase URL ve anon key
supabase/schema.sql   Veritabanı şeması ve güvenlik kuralları
games/<oyun>/         Her oyun kendi klasöründe, tek index.html
```

## Kurulum

### 1. Supabase

1. [supabase.com](https://supabase.com) → **Sign in with GitHub** → **New project**.
   Bölge olarak **Frankfurt (eu-central-1)** seçin. Veritabanı şifresini bir yere not edin, kodda kullanılmaz.
2. Sol menüden **SQL Editor** → **New query**. `supabase/schema.sql` dosyasının tamamını yapıştırıp **Run**.
3. **Project Settings → API** sayfasından iki değeri alın:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** anahtarı
4. İkisini `shared/config.js` içine yazın ve commit edin.

anon anahtarının tarayıcıda görünmesi normaldir. Güvenlik `schema.sql` içindeki
Row Level Security kurallarıyla sağlanır: tarayıcı yalnızca skor ekleyebilir ve okuyabilir,
güncelleyemez ve silemez.

### 2. GitHub Pages

1. GitHub'da `egido` adında **public** bir depo açın (Pages ücretsiz planda yalnızca public depolarda çalışır).
2. Bu klasörü depoya gönderin (`git push`).
3. Depo sayfasında **Settings → Pages → Build and deployment**:
   Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)** → Save.
4. Bir iki dakika sonra `https://<kullanıcı>.github.io/egido/` yayında olur.

## Öğrenciler nasıl katılır

1. Öğretmen soru setini yazıp **Öğrenci Kodu Oluştur** der. Panelde 5 harflik kod (örn. `KALE7`), QR kod ve kısa bağlantı çıkar. **Tam Ekran Göster** ile tahtaya yansıtılır.
2. Öğrenci ya tabletin kamerasıyla QR'ı okutur ya da `kalkansa.github.io/egido` adresine girip kodu yazar.
3. Ad ve sınıfını yazar, oynar. Skoru sınıfın ortak tablosuna düşer.

Kod → soru seti eşlemesi Supabase'deki `sets` tablosunda tutulur. Supabase ayarı yoksa
panel kod yerine ayarları içeren uzun bağlantıyı ve onun QR'ını gösterir.

## Skor tablosu nasıl çalışır

- Her soru seti için bir anahtar üretilir: oyun kimliği + soru/cevapların özeti + oturum kimliği (`sid`).
- Öğretmenin paylaştığı bağlantı bu anahtarı taşır; aynı bağlantıyı açan herkes aynı tabloyu görür.
- Aynı öğrencinin (ad + sınıf) yalnızca en iyi skoru listelenir.
- **Yeni Tablo Başlat** eski skorları silmez, yeni bir oturum kimliği üretir. Bağlantı değiştiği için öğretmen bağlantıyı yeniden paylaşır.
- `shared/config.js` boşsa skorlar yalnızca o tarayıcının yerel deposunda tutulur (geliştirme modu).

## Yeni oyun ekleme

1. `games/<yeni-oyun>/index.html` oluşturun. Balon oyununu şablon olarak kopyalayabilirsiniz.
2. Dosyada `GAME_ID` sabitini oyunun kimliğiyle değiştirin; skorlar bu kimlikle ayrışır.
3. `shared/config.js` dosyasını `../../shared/config.js` yolundan yükleyin.
4. Ana sayfadaki (`index.html`) listeye bir kart ekleyin.

Ortak kalan parçalar: öğretmen paneli, öğrenci giriş ekranı, `Store` (Supabase / yerel depo),
skor tablosu ve sonuç ekranı. Oyun tipi yalnızca canvas sahnesini ve kurallarını değiştirir.
