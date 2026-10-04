// Ortak ayarlar. Tüm oyunlar bu dosyayı yükler.
//
// Supabase bilgilerini doldurun: Supabase panelinde Project Settings → API altında
// "Project URL" ve "anon public" anahtarı bulunur. anon anahtarı tarayıcıda açık durur,
// bu normaldir; güvenlik veritabanındaki Row Level Security kurallarıyla sağlanır
// (bkz. supabase/schema.sql). İki alan da boş bırakılırsa oyunlar skorları yalnızca
// tarayıcının yerel deposunda tutar.
window.BP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  // Öğretmen kullanıcı adlarına eklenen alan adı: "ayse" → ayse@egido.local
  // Supabase panelinde kullanıcıyı bu e-posta ile açın.
  userDomain: 'egido.local',
};
