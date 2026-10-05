// Ortak ayarlar. Tüm oyunlar bu dosyayı yükler.
//
// Supabase bilgilerini doldurun: Supabase panelinde Project Settings → API altında
// "Project URL" ve "anon public" anahtarı bulunur. anon anahtarı tarayıcıda açık durur,
// bu normaldir; güvenlik veritabanındaki Row Level Security kurallarıyla sağlanır
// (bkz. supabase/schema.sql). İki alan da boş bırakılırsa oyunlar skorları yalnızca
// tarayıcının yerel deposunda tutar.
window.BP_CONFIG = {
  supabaseUrl: 'https://zjroopozremuafravdyd.supabase.co',
  supabaseAnonKey: 'sb_publishable_A1GvWLg0Ylvy1gc3e469Lg_KXwv7DV0',
  // Öğretmen kullanıcı adlarına eklenen alan adı: "ayse" → ayse@egido.local
  // Supabase panelinde kullanıcıyı bu e-posta ile açın.
  userDomain: 'egido.local',
  // Pixabay resim araması için ücretsiz API anahtarı (pixabay.com → hesap → API). Boşsa arama sekmesi uyarı gösterir.
  pixabayKey: '57886437-af7d1a39670e4c257fe072ccc',
};
