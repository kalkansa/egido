// Egido çok dil desteği: Türkçe, İngilizce, Almanca, İspanyolca.
// Kullanım: I18N.t('anahtar', {degisken}) · HTML'de data-i18n="anahtar" (innerHTML), data-i18n-ph (placeholder), data-i18n-title (title)
// Dil seçimi: ?lang=xx › localStorage › tarayıcı dili › tr. Öğretmenin dili oyun ayarına yazılır, öğrenci o dille açar.
window.I18N = (() => {
  'use strict';
  const LANGS = [['tr', '🇹🇷 Türkçe'], ['en', '🇬🇧 English'], ['de', '🇩🇪 Deutsch'], ['es', '🇪🇸 Español']];
  const D = {
  tr: {
    // ortak
    'lang': 'Dil', 'go': 'Başla!', 'close': 'Kapat', 'loading': 'Yükleniyor…', 'store.local': 'yerel depo',
    'time.min': '{m}dk {s}sn', 'time.sec': '{s} sn',
    // öğrenci girişi
    'intro.name': '👤 Adın Soyadın', 'intro.namePh': 'Örn: Ayşe Yılmaz', 'intro.cls': '🏫 Sınıfın', 'intro.clsPh': 'Örn: 5-A',
    'intro.start': 'Başla!', 'intro.lb': '🏆 Skor Tablosu', 'intro.teacher': 'Öğretmen misiniz? Ayarları düzenleyin',
    'intro.errName': 'Lütfen adını yaz.', 'intro.errCls': 'Lütfen sınıfını yaz (örn: 5-A).',
    'intro.loading': 'Oyun yükleniyor…', 'intro.notFound': 'Bu kodla oyun bulunamadı', 'intro.notFoundHint': 'Kodu kontrol edip ana sayfadan tekrar dene.',
    'intro.loadFail': 'Oyun yüklenemedi', 'intro.loadFailHint': 'İnternet bağlantısını kontrol edip sayfayı yenile.',
    // sonuç
    'res.score': 'Puan', 'res.correct': 'Doğru', 'res.wrong': 'Yanlış', 'res.time': 'Süre',
    'res.again': '🔁 Tekrar Oyna', 'res.changePlayer': '👤 Oyuncu Değiştir', 'res.settings': '⚙ Ayarlar', 'res.missed': 'Kaçırılanlar:',
    'res.saving': 'Skor kaydediliyor…', 'res.rank': 'Sıralaman: {r}. / {n}', 'res.best': 'En iyi skorun {b} puan ({r}. sıra). Bu tur: {s} puan.',
    'res.saveFail': 'Skor kaydedilemedi ({store}). İnternet bağlantısını kontrol edin.', 'res.you': '… {r}. sırada sen varsın',
    'res.won': 'Tebrikler!', 'res.over': 'Oyun bitti', 'res.quit': 'Oyundan çıkıldı',
    // skor tablosu
    'lb.title': '🏆 Skor Tablosu', 'lb.all': 'Tüm sınıflar', 'lb.student': 'Öğrenci', 'lb.empty': 'Henüz skor yok. İlk sen ol!',
    'lb.fail': 'Skor tablosu alınamadı ({store}). İnternet bağlantısını kontrol edin.', 'lb.new': '🔄 Yeni Tablo Başlat',
    'lb.confirm': 'Yeni, boş bir skor tablosu başlatılsın mı?\n\nEski skorlar görünmez olur. Öğrenci kodu aynı kalır.', 'lb.started': 'Yeni skor tablosu başlatıldı.',
    // kod / QR
    'share.label': 'Oyun kodu', 'share.join': 'Öğrenciler <b>{url}</b> adresine girip kodu yazar ya da QR okutur.',
    'share.local': 'Yerel mod: tüm ayarlar bağlantının içinde. Kısa kod için Supabase ve öğretmen girişi gerekir.',
    'share.copy': 'Bağlantıyı Kopyala', 'share.big': '⛶ Tam Ekran Göster', 'share.scan': 'Tabletin kamerasıyla okut',
    'share.copied': 'Bağlantı kopyalandı.', 'share.copyManual': 'Bağlantıyı kutudan kopyalayın.', 'share.bigLabel': 'Oyuna katılmak için', 'share.scanQr': 'QR kodu okut',
    'share.qrFail': 'QR kütüphanesi yüklenemedi', 'share.tooLong': 'Bağlantı QR için çok uzun. Kısa kod için öğretmen girişi gerekir.',
    // öğretmen çubuğu
    'tbar.back': '← Oyunlarım', 'tbar.titlePh': 'Oyun adı (örn: 5-A Memeliler)', 'tbar.save': '💾 Kaydet', 'tbar.login': 'Öğretmen girişi', 'tbar.logout': 'Çıkış',
    'tbar.local': 'Yerel mod: Supabase ayarı yok. Kaydetme ve kod üretme kapalı; bağlantı ile paylaşabilirsiniz.',
    'tbar.saved': 'Oyun kaydedildi.', 'tbar.needLogin': 'Kaydetmek ve oyun kodu almak için <a href="{url}">öğretmen girişi</a> yapın.',
    'tbar.saveFail': 'Kaydedilemedi: {e}', 'tbar.openNeedLogin': 'Kayıtlı oyunu açmak için <a href="{url}">öğretmen girişi</a> yapın.', 'tbar.notFound': 'Kayıtlı oyun bulunamadı ya da size ait değil.',
    // ortak kurulum düğmeleri
    'setup.try': '▶ Oyunu Dene', 'setup.code': '🎟 Öğrenci Kodu Oluştur', 'setup.lb': '🏆 Skor Tablosu', 'setup.example': 'Örnek doldur',
    // ana sayfa
    'home.sub': 'Öğretmen soruları hazırlar, öğrenciler kodla katılır, sınıf yarışır.',
    'home.studentTitle': '🎟 Öğrenci misin?', 'home.studentSub': 'Öğretmeninin tahtaya yazdığı 5 harfli kodu gir.', 'home.join': 'Katıl', 'home.searching': 'Aranıyor…',
    'home.codeLen': 'Kod 5 karakter olmalı.', 'home.codeOff': 'Oyun kodları henüz etkin değil.', 'home.codeNotFound': 'Bu kodla bir oyun bulunamadı. Kodu kontrol et.', 'home.netFail': 'Bağlantı hatası. İnterneti kontrol edip tekrar dene.',
    'home.teacherTitle': '👩‍🏫 Öğretmen Girişi', 'home.teacherSub': 'Hesabınız yöneticiniz tarafından açılır.', 'home.user': 'Kullanıcı adı', 'home.pass': 'Şifre', 'home.login': 'Giriş Yap', 'home.loggingIn': 'Giriş yapılıyor…',
    'home.noSb': 'Supabase ayarı yapılmadan giriş yapılamaz.', 'home.needBoth': 'Kullanıcı adı ve şifre gerekli.', 'home.badLogin': 'Kullanıcı adı veya şifre hatalı.',
    'home.myGames': 'Oyunlarım', 'home.saved': 'Kayıtlı oyunlar', 'home.listFail': 'Liste alınamadı: {e}', 'home.noGames': 'Henüz kayıtlı oyun yok. Yukarıdan bir oyun türü seçip soruları yazın, "Kaydet" deyin.',
    'home.colGame': 'Oyun', 'home.colTitle': 'Ad', 'home.colCode': 'Kod', 'home.colDate': 'Güncelleme', 'home.untitled': '(adsız)', 'home.showCode': '🎟 Kodu Göster', 'home.edit': '✏ Düzenle',
    'home.delConfirm': '"{t}" silinsin mi? Kod artık çalışmaz.', 'home.delFail': 'Silinemedi: {e}', 'home.footer': 'Öğrencilerden yalnızca ad ve sınıf istenir. Skorlar ders için tutulur.',
    'game.balon.name': 'Balon Patlat', 'game.balon.desc': 'Doğru cevaplı balonları patlat', 'game.puzzle.name': 'Harf Puzzle', 'game.puzzle.desc': 'Resme bak, harfleri dizip kelimeyi yaz',
    // balon
    'balon.title': '🎈 Balon <span>Patlat</span>', 'balon.sub': 'Soruyu ve cevapları yazın. Doğru cevaplı balonlar patlatılır, yanlışlara dokunulmaz.',
    'balon.q': 'Soru / Yönerge <small>(oyun ekranının üstünde büyük görünür)</small>', 'balon.qPh': 'Örn: Aşağıdakilerden hangileri memeli hayvandır?',
    'balon.correct': '✅ Doğru cevaplar <small>(her satıra bir tane)</small>', 'balon.correctPh': 'Balina\nYarasa\nFil', 'balon.wrong': '❌ Yanlış cevaplar <small>(her satıra bir tane)</small>', 'balon.wrongPh': 'Köpekbalığı\nPenguen\nTimsah',
    'balon.speed': 'Hız', 'balon.speed1': 'Yavaş', 'balon.speed2': 'Normal', 'balon.speed3': 'Hızlı', 'balon.speed4': 'Çok hızlı',
    'balon.lives': 'Can hakkı', 'balon.unlimited': 'Sınırsız', 'balon.duration': 'Süre', 'balon.noTime': 'Süresiz', 'balon.sec': '{s} saniye', 'balon.min2': '2 dakika',
    'balon.hint': 'Kazanmak için tüm doğru balonların patlatılması gerekir. Yanlış balon patlatınca bir can gider.',
    'balon.errCorrect': 'En az bir doğru cevap yazmalısınız.', 'balon.errWrong': 'En az bir yanlış cevap yazmalısınız.', 'balon.errDup': 'Hem doğru hem yanlış listesinde olan cevap var: {d}',
    'balon.rules': 'Doğru cevap yazan balonları patlat: <b class="ok">+10 puan</b>. Yanlış olanlara dokunursan <b class="bad">bir can</b> gider.', 'balon.default': 'Doğru balonları patlat!',
    'balon.wrongPop': 'Yanlış!', 'balon.paused': 'Duraklatıldı', 'balon.resume': '▶ Devam', 'balon.quit': 'Çıkış',
    'balon.perfect': 'Mükemmel!', 'balon.perfectMsg': 'Tüm doğru balonları hiç hata yapmadan patlattın.', 'balon.wonMsg': 'Tüm doğru balonları patlattın, {w} yanlış patlatma oldu.',
    'balon.lost': 'Canların bitti', 'balon.lostMsg': '{t} doğru cevaptan {g} tanesini bulabildin. Tekrar dene!', 'balon.timeout': 'Süre doldu', 'balon.timeoutMsg': '{t} doğru cevaptan {g} tanesini patlattın.',
    'balon.missed': 'Patlatılmayan doğru cevaplar:',
    'balon.exQ': 'Hangileri memeli hayvandır?', 'balon.exCorrect': 'Balina|Yarasa|Fil|Yunus|Kanguru', 'balon.exWrong': 'Köpekbalığı|Penguen|Timsah|Kertenkele|Kartal|Kurbağa|Ahtapot',
    // puzzle
    'puzzle.title': '🧩 Harf <span>Puzzle</span>', 'puzzle.sub': 'Her soru için bir resim (ya da emoji) ve yazılışını ekleyin. Harfler karışık parçalar olarak dağılır, öğrenci doğru sırayla dizer.',
    'puzzle.items': 'Sorular <small>(istediğiniz kadar ekleyin; resim bilgisayardan seçilir, küçültülerek saklanır)</small>', 'puzzle.add': '+ Soru ekle', 'puzzle.noItems': 'Henüz soru yok. "Soru ekle" ile başlayın.',
    'puzzle.pick': 'Resim seç', 'puzzle.imgPh': 'Resim seç ↖ ya da emoji / resim adresi yaz', 'puzzle.wordPh': 'Yazılışı (örn: FİL)', 'puzzle.remove': 'Sil', 'puzzle.imgFail': 'Resim okunamadı.',
    'puzzle.order': 'Soru sırası', 'puzzle.random': 'Karışık', 'puzzle.fixed': 'Yazıldığı sıra', 'puzzle.time': 'Soru başına süre', 'puzzle.noTime': 'Süresiz', 'puzzle.sec': '{s} sn',
    'puzzle.extra': 'Fazladan harf', 'puzzle.none': 'Yok', 'puzzle.letters': '{n} harf', 'puzzle.hint': 'İpucu', 'puzzle.firstLetter': 'İlk harf açık',
    'puzzle.help': 'Öğrenci "Tamam" deyince cevap kontrol edilir, yanlışsa doğrusu gösterilir ve sonraki soruya geçilir.',
    'puzzle.errEmpty': 'En az bir soru ekleyin (resim + yazılışı).', 'puzzle.errShort': '"{w}" çok kısa; en az 2 harf olmalı.', 'puzzle.errLong': '"{w}" çok uzun; en fazla 16 harf olmalı.',
    'puzzle.rules': 'Resme bak, karışık harf parçalarına dokunarak kelimeyi doğru sırayla diz. Her doğru kelime <b class="ok">+10 puan</b>, hızlı bitirirsen bonus var.',
    'puzzle.summary': 'Harf Puzzle · {n} kelime', 'puzzle.writeWord': 'Kelimeyi yaz', 'puzzle.undo': '⌫ Sil', 'puzzle.shuffle': '🔀 Karıştır', 'puzzle.ok': '✔ Tamam',
    'puzzle.fillAll': 'Önce tüm harfleri yerleştir.', 'puzzle.right': 'Doğru! +{p}', 'puzzle.wrongIs': 'Yanlış. Doğrusu: <b>{w}</b>', 'puzzle.timeIs': 'Süre doldu. Doğrusu: <b>{w}</b>',
    'puzzle.quitConfirm': 'Oyundan çıkılsın mı? Skor kaydedilmez.', 'puzzle.perfect': 'Mükemmel!', 'puzzle.perfectMsg': 'Bütün kelimeleri doğru yazdın.', 'puzzle.overMsg': '{t} kelimeden {c} tanesini doğru yazdın.',
    'puzzle.missed': 'Yanlış yazılan kelimeler:',
    'puzzle.ex': '🐘:FİL|🍎:ELMA|🚗:ARABA|🐱:KEDİ|🌙:AY|🍓:ÇİLEK',
  },
  en: {
    'lang': 'Language', 'go': 'Go!', 'close': 'Close', 'loading': 'Loading…', 'store.local': 'local storage',
    'time.min': '{m}m {s}s', 'time.sec': '{s} s',
    'intro.name': '👤 Your name', 'intro.namePh': 'e.g. Emma Smith', 'intro.cls': '🏫 Your class', 'intro.clsPh': 'e.g. 5-A',
    'intro.start': 'Start!', 'intro.lb': '🏆 Leaderboard', 'intro.teacher': 'Are you the teacher? Edit settings',
    'intro.errName': 'Please type your name.', 'intro.errCls': 'Please type your class (e.g. 5-A).',
    'intro.loading': 'Loading game…', 'intro.notFound': 'No game found for this code', 'intro.notFoundHint': 'Check the code and try again from the home page.',
    'intro.loadFail': 'Could not load the game', 'intro.loadFailHint': 'Check your internet connection and reload the page.',
    'res.score': 'Score', 'res.correct': 'Correct', 'res.wrong': 'Wrong', 'res.time': 'Time',
    'res.again': '🔁 Play Again', 'res.changePlayer': '👤 Change Player', 'res.settings': '⚙ Settings', 'res.missed': 'Missed:',
    'res.saving': 'Saving score…', 'res.rank': 'Your rank: {r} / {n}', 'res.best': 'Your best is {b} points (rank {r}). This round: {s} points.',
    'res.saveFail': 'Score could not be saved ({store}). Check your internet connection.', 'res.you': '… you are at rank {r}',
    'res.won': 'Congratulations!', 'res.over': 'Game over', 'res.quit': 'Left the game',
    'lb.title': '🏆 Leaderboard', 'lb.all': 'All classes', 'lb.student': 'Student', 'lb.empty': 'No scores yet. Be the first!',
    'lb.fail': 'Could not load the leaderboard ({store}). Check your internet connection.', 'lb.new': '🔄 Start New Board',
    'lb.confirm': 'Start a new, empty leaderboard?\n\nOld scores will be hidden. The game code stays the same.', 'lb.started': 'New leaderboard started.',
    'share.label': 'Game code', 'share.join': 'Students open <b>{url}</b> and type the code, or scan the QR.',
    'share.local': 'Local mode: all settings live inside the link. Short codes need Supabase and a teacher login.',
    'share.copy': 'Copy Link', 'share.big': '⛶ Show Full Screen', 'share.scan': 'Scan with the tablet camera',
    'share.copied': 'Link copied.', 'share.copyManual': 'Copy the link from the box.', 'share.bigLabel': 'To join the game', 'share.scanQr': 'Scan the QR code',
    'share.qrFail': 'QR library failed to load', 'share.tooLong': 'Link is too long for a QR code. Short codes need a teacher login.',
    'tbar.back': '← My Games', 'tbar.titlePh': 'Game name (e.g. 5-A Mammals)', 'tbar.save': '💾 Save', 'tbar.login': 'Teacher login', 'tbar.logout': 'Sign out',
    'tbar.local': 'Local mode: no Supabase config. Saving and codes are off; you can share by link.',
    'tbar.saved': 'Game saved.', 'tbar.needLogin': '<a href="{url}">Sign in as a teacher</a> to save and get a game code.',
    'tbar.saveFail': 'Could not save: {e}', 'tbar.openNeedLogin': '<a href="{url}">Sign in as a teacher</a> to open a saved game.', 'tbar.notFound': 'Saved game not found or not yours.',
    'setup.try': '▶ Try the Game', 'setup.code': '🎟 Create Student Code', 'setup.lb': '🏆 Leaderboard', 'setup.example': 'Fill example',
    'home.sub': 'Teachers prepare questions, students join with a code, the class competes.',
    'home.studentTitle': '🎟 Are you a student?', 'home.studentSub': 'Enter the 5-letter code your teacher wrote on the board.', 'home.join': 'Join', 'home.searching': 'Searching…',
    'home.codeLen': 'The code must be 5 characters.', 'home.codeOff': 'Game codes are not enabled yet.', 'home.codeNotFound': 'No game found for this code. Check the code.', 'home.netFail': 'Connection error. Check your internet and try again.',
    'home.teacherTitle': '👩‍🏫 Teacher Login', 'home.teacherSub': 'Accounts are created by your administrator.', 'home.user': 'Username', 'home.pass': 'Password', 'home.login': 'Sign In', 'home.loggingIn': 'Signing in…',
    'home.noSb': 'Sign-in needs the Supabase configuration.', 'home.needBoth': 'Username and password are required.', 'home.badLogin': 'Wrong username or password.',
    'home.myGames': 'My Games', 'home.saved': 'Saved games', 'home.listFail': 'Could not load the list: {e}', 'home.noGames': 'No saved games yet. Pick a game type above, write the questions and press "Save".',
    'home.colGame': 'Game', 'home.colTitle': 'Name', 'home.colCode': 'Code', 'home.colDate': 'Updated', 'home.untitled': '(untitled)', 'home.showCode': '🎟 Show Code', 'home.edit': '✏ Edit',
    'home.delConfirm': 'Delete "{t}"? The code will stop working.', 'home.delFail': 'Could not delete: {e}', 'home.footer': 'Students only enter a name and class. Scores are kept for the lesson.',
    'game.balon.name': 'Balloon Pop', 'game.balon.desc': 'Pop the balloons with correct answers', 'game.puzzle.name': 'Letter Puzzle', 'game.puzzle.desc': 'Look at the picture, arrange the letters',
    'balon.title': '🎈 Balloon <span>Pop</span>', 'balon.sub': 'Write the question and the answers. Balloons with correct answers get popped, wrong ones must not be touched.',
    'balon.q': 'Question / Instruction <small>(shown large at the top of the game)</small>', 'balon.qPh': 'e.g. Which of these are mammals?',
    'balon.correct': '✅ Correct answers <small>(one per line)</small>', 'balon.correctPh': 'Whale\nBat\nElephant', 'balon.wrong': '❌ Wrong answers <small>(one per line)</small>', 'balon.wrongPh': 'Shark\nPenguin\nCrocodile',
    'balon.speed': 'Speed', 'balon.speed1': 'Slow', 'balon.speed2': 'Normal', 'balon.speed3': 'Fast', 'balon.speed4': 'Very fast',
    'balon.lives': 'Lives', 'balon.unlimited': 'Unlimited', 'balon.duration': 'Time limit', 'balon.noTime': 'No limit', 'balon.sec': '{s} seconds', 'balon.min2': '2 minutes',
    'balon.hint': 'To win, all correct balloons must be popped. Popping a wrong balloon costs a life.',
    'balon.errCorrect': 'Add at least one correct answer.', 'balon.errWrong': 'Add at least one wrong answer.', 'balon.errDup': 'An answer is in both lists: {d}',
    'balon.rules': 'Pop the balloons with correct answers: <b class="ok">+10 points</b>. Touching a wrong one costs <b class="bad">a life</b>.', 'balon.default': 'Pop the correct balloons!',
    'balon.wrongPop': 'Wrong!', 'balon.paused': 'Paused', 'balon.resume': '▶ Resume', 'balon.quit': 'Quit',
    'balon.perfect': 'Perfect!', 'balon.perfectMsg': 'You popped every correct balloon without a single mistake.', 'balon.wonMsg': 'You popped every correct balloon with {w} wrong pops.',
    'balon.lost': 'Out of lives', 'balon.lostMsg': 'You found {g} of {t} correct answers. Try again!', 'balon.timeout': 'Time is up', 'balon.timeoutMsg': 'You popped {g} of {t} correct answers.',
    'balon.missed': 'Correct answers not popped:',
    'balon.exQ': 'Which of these are mammals?', 'balon.exCorrect': 'Whale|Bat|Elephant|Dolphin|Kangaroo', 'balon.exWrong': 'Shark|Penguin|Crocodile|Lizard|Eagle|Frog|Octopus',
    'puzzle.title': '🧩 Letter <span>Puzzle</span>', 'puzzle.sub': 'Add a picture (or emoji) and its word for each question. Letters are scattered as puzzle pieces; the student puts them in order.',
    'puzzle.items': 'Questions <small>(add as many as you like; pictures are chosen from your computer and stored resized)</small>', 'puzzle.add': '+ Add question', 'puzzle.noItems': 'No questions yet. Start with "Add question".',
    'puzzle.pick': 'Choose picture', 'puzzle.imgPh': 'Choose a picture ↖ or type an emoji / image URL', 'puzzle.wordPh': 'The word (e.g. ELEPHANT)', 'puzzle.remove': 'Remove', 'puzzle.imgFail': 'Could not read the image.',
    'puzzle.order': 'Question order', 'puzzle.random': 'Shuffled', 'puzzle.fixed': 'As written', 'puzzle.time': 'Time per question', 'puzzle.noTime': 'No limit', 'puzzle.sec': '{s} s',
    'puzzle.extra': 'Extra letters', 'puzzle.none': 'None', 'puzzle.letters': '{n} letters', 'puzzle.hint': 'Hint', 'puzzle.firstLetter': 'First letter shown',
    'puzzle.help': 'When the student presses "Done" the answer is checked; if wrong, the correct word is shown and the next question starts.',
    'puzzle.errEmpty': 'Add at least one question (picture + word).', 'puzzle.errShort': '"{w}" is too short; at least 2 letters.', 'puzzle.errLong': '"{w}" is too long; at most 16 letters.',
    'puzzle.rules': 'Look at the picture and tap the scattered letter pieces to spell the word. Each correct word is <b class="ok">+10 points</b>, with a bonus for speed.',
    'puzzle.summary': 'Letter Puzzle · {n} words', 'puzzle.writeWord': 'Spell the word', 'puzzle.undo': '⌫ Undo', 'puzzle.shuffle': '🔀 Shuffle', 'puzzle.ok': '✔ Done',
    'puzzle.fillAll': 'Place all the letters first.', 'puzzle.right': 'Correct! +{p}', 'puzzle.wrongIs': 'Wrong. It was: <b>{w}</b>', 'puzzle.timeIs': 'Time is up. It was: <b>{w}</b>',
    'puzzle.quitConfirm': 'Leave the game? The score will not be saved.', 'puzzle.perfect': 'Perfect!', 'puzzle.perfectMsg': 'You spelled every word correctly.', 'puzzle.overMsg': 'You spelled {c} of {t} words correctly.',
    'puzzle.missed': 'Misspelled words:',
    'puzzle.ex': '🐘:ELEPHANT|🍎:APPLE|🚗:CAR|🐱:CAT|🌙:MOON|🍓:STRAWBERRY',
  },
  de: {
    'lang': 'Sprache', 'go': 'Los!', 'close': 'Schließen', 'loading': 'Lädt…', 'store.local': 'lokaler Speicher',
    'time.min': '{m}min {s}s', 'time.sec': '{s} s',
    'intro.name': '👤 Dein Name', 'intro.namePh': 'z. B. Anna Müller', 'intro.cls': '🏫 Deine Klasse', 'intro.clsPh': 'z. B. 5a',
    'intro.start': 'Start!', 'intro.lb': '🏆 Bestenliste', 'intro.teacher': 'Lehrkraft? Einstellungen bearbeiten',
    'intro.errName': 'Bitte gib deinen Namen ein.', 'intro.errCls': 'Bitte gib deine Klasse ein (z. B. 5a).',
    'intro.loading': 'Spiel wird geladen…', 'intro.notFound': 'Kein Spiel mit diesem Code gefunden', 'intro.notFoundHint': 'Prüfe den Code und versuche es von der Startseite erneut.',
    'intro.loadFail': 'Spiel konnte nicht geladen werden', 'intro.loadFailHint': 'Prüfe die Internetverbindung und lade die Seite neu.',
    'res.score': 'Punkte', 'res.correct': 'Richtig', 'res.wrong': 'Falsch', 'res.time': 'Zeit',
    'res.again': '🔁 Nochmal spielen', 'res.changePlayer': '👤 Spieler wechseln', 'res.settings': '⚙ Einstellungen', 'res.missed': 'Verpasst:',
    'res.saving': 'Punkte werden gespeichert…', 'res.rank': 'Dein Platz: {r} / {n}', 'res.best': 'Dein Bestwert ist {b} Punkte (Platz {r}). Diese Runde: {s} Punkte.',
    'res.saveFail': 'Punkte konnten nicht gespeichert werden ({store}). Prüfe die Internetverbindung.', 'res.you': '… du bist auf Platz {r}',
    'res.won': 'Glückwunsch!', 'res.over': 'Spiel vorbei', 'res.quit': 'Spiel verlassen',
    'lb.title': '🏆 Bestenliste', 'lb.all': 'Alle Klassen', 'lb.student': 'Schüler/in', 'lb.empty': 'Noch keine Punkte. Sei die/der Erste!',
    'lb.fail': 'Bestenliste konnte nicht geladen werden ({store}). Prüfe die Internetverbindung.', 'lb.new': '🔄 Neue Liste starten',
    'lb.confirm': 'Eine neue, leere Bestenliste starten?\n\nAlte Punkte werden ausgeblendet. Der Spielcode bleibt gleich.', 'lb.started': 'Neue Bestenliste gestartet.',
    'share.label': 'Spielcode', 'share.join': 'Schüler öffnen <b>{url}</b> und geben den Code ein oder scannen den QR-Code.',
    'share.local': 'Lokaler Modus: alle Einstellungen stecken im Link. Für kurze Codes sind Supabase und ein Lehrer-Login nötig.',
    'share.copy': 'Link kopieren', 'share.big': '⛶ Vollbild anzeigen', 'share.scan': 'Mit der Tablet-Kamera scannen',
    'share.copied': 'Link kopiert.', 'share.copyManual': 'Kopiere den Link aus dem Feld.', 'share.bigLabel': 'Zum Mitspielen', 'share.scanQr': 'QR-Code scannen',
    'share.qrFail': 'QR-Bibliothek konnte nicht geladen werden', 'share.tooLong': 'Der Link ist zu lang für einen QR-Code. Kurze Codes brauchen ein Lehrer-Login.',
    'tbar.back': '← Meine Spiele', 'tbar.titlePh': 'Spielname (z. B. 5a Säugetiere)', 'tbar.save': '💾 Speichern', 'tbar.login': 'Lehrer-Login', 'tbar.logout': 'Abmelden',
    'tbar.local': 'Lokaler Modus: keine Supabase-Konfiguration. Speichern und Codes sind aus; teilen per Link möglich.',
    'tbar.saved': 'Spiel gespeichert.', 'tbar.needLogin': '<a href="{url}">Als Lehrkraft anmelden</a>, um zu speichern und einen Spielcode zu erhalten.',
    'tbar.saveFail': 'Speichern fehlgeschlagen: {e}', 'tbar.openNeedLogin': '<a href="{url}">Als Lehrkraft anmelden</a>, um ein gespeichertes Spiel zu öffnen.', 'tbar.notFound': 'Gespeichertes Spiel nicht gefunden oder nicht deins.',
    'setup.try': '▶ Spiel testen', 'setup.code': '🎟 Schülercode erstellen', 'setup.lb': '🏆 Bestenliste', 'setup.example': 'Beispiel einfügen',
    'home.sub': 'Lehrkräfte bereiten Fragen vor, Schüler treten per Code bei, die Klasse wetteifert.',
    'home.studentTitle': '🎟 Bist du Schüler/in?', 'home.studentSub': 'Gib den 5-stelligen Code von der Tafel ein.', 'home.join': 'Beitreten', 'home.searching': 'Suche…',
    'home.codeLen': 'Der Code muss 5 Zeichen haben.', 'home.codeOff': 'Spielcodes sind noch nicht aktiv.', 'home.codeNotFound': 'Kein Spiel mit diesem Code gefunden. Prüfe den Code.', 'home.netFail': 'Verbindungsfehler. Prüfe das Internet und versuche es erneut.',
    'home.teacherTitle': '👩‍🏫 Lehrer-Login', 'home.teacherSub': 'Konten werden von der Administration angelegt.', 'home.user': 'Benutzername', 'home.pass': 'Passwort', 'home.login': 'Anmelden', 'home.loggingIn': 'Anmeldung…',
    'home.noSb': 'Für die Anmeldung fehlt die Supabase-Konfiguration.', 'home.needBoth': 'Benutzername und Passwort sind erforderlich.', 'home.badLogin': 'Benutzername oder Passwort falsch.',
    'home.myGames': 'Meine Spiele', 'home.saved': 'Gespeicherte Spiele', 'home.listFail': 'Liste konnte nicht geladen werden: {e}', 'home.noGames': 'Noch keine gespeicherten Spiele. Wähle oben einen Spieltyp, schreibe die Fragen und drücke „Speichern“.',
    'home.colGame': 'Spiel', 'home.colTitle': 'Name', 'home.colCode': 'Code', 'home.colDate': 'Aktualisiert', 'home.untitled': '(ohne Namen)', 'home.showCode': '🎟 Code zeigen', 'home.edit': '✏ Bearbeiten',
    'home.delConfirm': '„{t}“ löschen? Der Code funktioniert dann nicht mehr.', 'home.delFail': 'Löschen fehlgeschlagen: {e}', 'home.footer': 'Schüler geben nur Name und Klasse ein. Punkte werden für die Stunde gespeichert.',
    'game.balon.name': 'Ballons platzen', 'game.balon.desc': 'Ballons mit richtigen Antworten zerplatzen lassen', 'game.puzzle.name': 'Buchstaben-Puzzle', 'game.puzzle.desc': 'Bild ansehen, Buchstaben ordnen',
    'balon.title': '🎈 Ballons <span>platzen</span>', 'balon.sub': 'Schreibe Frage und Antworten. Ballons mit richtigen Antworten werden zerplatzt, falsche dürfen nicht berührt werden.',
    'balon.q': 'Frage / Anweisung <small>(oben im Spiel groß sichtbar)</small>', 'balon.qPh': 'z. B. Welche davon sind Säugetiere?',
    'balon.correct': '✅ Richtige Antworten <small>(eine pro Zeile)</small>', 'balon.correctPh': 'Wal\nFledermaus\nElefant', 'balon.wrong': '❌ Falsche Antworten <small>(eine pro Zeile)</small>', 'balon.wrongPh': 'Hai\nPinguin\nKrokodil',
    'balon.speed': 'Tempo', 'balon.speed1': 'Langsam', 'balon.speed2': 'Normal', 'balon.speed3': 'Schnell', 'balon.speed4': 'Sehr schnell',
    'balon.lives': 'Leben', 'balon.unlimited': 'Unbegrenzt', 'balon.duration': 'Zeitlimit', 'balon.noTime': 'Kein Limit', 'balon.sec': '{s} Sekunden', 'balon.min2': '2 Minuten',
    'balon.hint': 'Zum Gewinnen müssen alle richtigen Ballons zerplatzt werden. Ein falscher Ballon kostet ein Leben.',
    'balon.errCorrect': 'Mindestens eine richtige Antwort eingeben.', 'balon.errWrong': 'Mindestens eine falsche Antwort eingeben.', 'balon.errDup': 'Eine Antwort steht in beiden Listen: {d}',
    'balon.rules': 'Zerplatze Ballons mit richtigen Antworten: <b class="ok">+10 Punkte</b>. Ein falscher Ballon kostet <b class="bad">ein Leben</b>.', 'balon.default': 'Zerplatze die richtigen Ballons!',
    'balon.wrongPop': 'Falsch!', 'balon.paused': 'Pause', 'balon.resume': '▶ Weiter', 'balon.quit': 'Beenden',
    'balon.perfect': 'Perfekt!', 'balon.perfectMsg': 'Du hast alle richtigen Ballons ohne Fehler zerplatzt.', 'balon.wonMsg': 'Alle richtigen Ballons zerplatzt, mit {w} Fehlern.',
    'balon.lost': 'Keine Leben mehr', 'balon.lostMsg': 'Du hast {g} von {t} richtigen Antworten gefunden. Versuch es nochmal!', 'balon.timeout': 'Zeit ist um', 'balon.timeoutMsg': 'Du hast {g} von {t} richtigen Antworten zerplatzt.',
    'balon.missed': 'Nicht zerplatzte richtige Antworten:',
    'balon.exQ': 'Welche davon sind Säugetiere?', 'balon.exCorrect': 'Wal|Fledermaus|Elefant|Delfin|Känguru', 'balon.exWrong': 'Hai|Pinguin|Krokodil|Eidechse|Adler|Frosch|Krake',
    'puzzle.title': '🧩 Buchstaben-<span>Puzzle</span>', 'puzzle.sub': 'Füge zu jeder Frage ein Bild (oder Emoji) und das Wort hinzu. Die Buchstaben werden als Puzzleteile verstreut; die Schüler ordnen sie.',
    'puzzle.items': 'Fragen <small>(beliebig viele; Bilder vom Computer werden verkleinert gespeichert)</small>', 'puzzle.add': '+ Frage hinzufügen', 'puzzle.noItems': 'Noch keine Fragen. Beginne mit „Frage hinzufügen“.',
    'puzzle.pick': 'Bild wählen', 'puzzle.imgPh': 'Bild wählen ↖ oder Emoji / Bild-URL eingeben', 'puzzle.wordPh': 'Das Wort (z. B. ELEFANT)', 'puzzle.remove': 'Entfernen', 'puzzle.imgFail': 'Bild konnte nicht gelesen werden.',
    'puzzle.order': 'Reihenfolge', 'puzzle.random': 'Gemischt', 'puzzle.fixed': 'Wie eingegeben', 'puzzle.time': 'Zeit pro Frage', 'puzzle.noTime': 'Kein Limit', 'puzzle.sec': '{s} s',
    'puzzle.extra': 'Zusatzbuchstaben', 'puzzle.none': 'Keine', 'puzzle.letters': '{n} Buchstaben', 'puzzle.hint': 'Tipp', 'puzzle.firstLetter': 'Erster Buchstabe sichtbar',
    'puzzle.help': 'Drückt der Schüler „Fertig“, wird geprüft; bei Fehler wird das richtige Wort gezeigt und die nächste Frage beginnt.',
    'puzzle.errEmpty': 'Mindestens eine Frage hinzufügen (Bild + Wort).', 'puzzle.errShort': '„{w}“ ist zu kurz; mindestens 2 Buchstaben.', 'puzzle.errLong': '„{w}“ ist zu lang; höchstens 16 Buchstaben.',
    'puzzle.rules': 'Sieh dir das Bild an und tippe die verstreuten Buchstaben in der richtigen Reihenfolge. Jedes richtige Wort gibt <b class="ok">+10 Punkte</b>, schnell sein bringt Bonus.',
    'puzzle.summary': 'Buchstaben-Puzzle · {n} Wörter', 'puzzle.writeWord': 'Schreibe das Wort', 'puzzle.undo': '⌫ Zurück', 'puzzle.shuffle': '🔀 Mischen', 'puzzle.ok': '✔ Fertig',
    'puzzle.fillAll': 'Lege zuerst alle Buchstaben.', 'puzzle.right': 'Richtig! +{p}', 'puzzle.wrongIs': 'Falsch. Richtig war: <b>{w}</b>', 'puzzle.timeIs': 'Zeit um. Richtig war: <b>{w}</b>',
    'puzzle.quitConfirm': 'Spiel verlassen? Die Punkte werden nicht gespeichert.', 'puzzle.perfect': 'Perfekt!', 'puzzle.perfectMsg': 'Du hast alle Wörter richtig geschrieben.', 'puzzle.overMsg': 'Du hast {c} von {t} Wörtern richtig geschrieben.',
    'puzzle.missed': 'Falsch geschriebene Wörter:',
    'puzzle.ex': '🐘:ELEFANT|🍎:APFEL|🚗:AUTO|🐱:KATZE|🌙:MOND|🍓:ERDBEERE',
  },
  es: {
    'lang': 'Idioma', 'go': '¡Ya!', 'close': 'Cerrar', 'loading': 'Cargando…', 'store.local': 'almacenamiento local',
    'time.min': '{m}min {s}s', 'time.sec': '{s} s',
    'intro.name': '👤 Tu nombre', 'intro.namePh': 'Ej.: Lucía García', 'intro.cls': '🏫 Tu clase', 'intro.clsPh': 'Ej.: 5-A',
    'intro.start': '¡Empezar!', 'intro.lb': '🏆 Clasificación', 'intro.teacher': '¿Eres el profesor? Editar ajustes',
    'intro.errName': 'Escribe tu nombre.', 'intro.errCls': 'Escribe tu clase (ej.: 5-A).',
    'intro.loading': 'Cargando el juego…', 'intro.notFound': 'No hay ningún juego con este código', 'intro.notFoundHint': 'Revisa el código e inténtalo de nuevo desde la página principal.',
    'intro.loadFail': 'No se pudo cargar el juego', 'intro.loadFailHint': 'Revisa la conexión a internet y recarga la página.',
    'res.score': 'Puntos', 'res.correct': 'Aciertos', 'res.wrong': 'Fallos', 'res.time': 'Tiempo',
    'res.again': '🔁 Jugar otra vez', 'res.changePlayer': '👤 Cambiar jugador', 'res.settings': '⚙ Ajustes', 'res.missed': 'No acertados:',
    'res.saving': 'Guardando puntuación…', 'res.rank': 'Tu puesto: {r} / {n}', 'res.best': 'Tu mejor marca es {b} puntos (puesto {r}). Esta ronda: {s} puntos.',
    'res.saveFail': 'No se pudo guardar la puntuación ({store}). Revisa la conexión a internet.', 'res.you': '… estás en el puesto {r}',
    'res.won': '¡Enhorabuena!', 'res.over': 'Fin del juego', 'res.quit': 'Saliste del juego',
    'lb.title': '🏆 Clasificación', 'lb.all': 'Todas las clases', 'lb.student': 'Alumno/a', 'lb.empty': 'Aún no hay puntuaciones. ¡Sé el primero!',
    'lb.fail': 'No se pudo cargar la clasificación ({store}). Revisa la conexión a internet.', 'lb.new': '🔄 Nueva clasificación',
    'lb.confirm': '¿Empezar una clasificación nueva y vacía?\n\nLas puntuaciones antiguas se ocultan. El código del juego no cambia.', 'lb.started': 'Nueva clasificación iniciada.',
    'share.label': 'Código del juego', 'share.join': 'Los alumnos entran en <b>{url}</b> y escriben el código, o escanean el QR.',
    'share.local': 'Modo local: todos los ajustes van dentro del enlace. Para códigos cortos hacen falta Supabase e inicio de sesión del profesor.',
    'share.copy': 'Copiar enlace', 'share.big': '⛶ Pantalla completa', 'share.scan': 'Escanea con la cámara de la tableta',
    'share.copied': 'Enlace copiado.', 'share.copyManual': 'Copia el enlace desde la casilla.', 'share.bigLabel': 'Para unirte al juego', 'share.scanQr': 'Escanea el código QR',
    'share.qrFail': 'No se pudo cargar la librería QR', 'share.tooLong': 'El enlace es demasiado largo para un QR. Los códigos cortos requieren iniciar sesión como profesor.',
    'tbar.back': '← Mis juegos', 'tbar.titlePh': 'Nombre del juego (ej.: 5-A Mamíferos)', 'tbar.save': '💾 Guardar', 'tbar.login': 'Acceso profesor', 'tbar.logout': 'Salir',
    'tbar.local': 'Modo local: sin configuración de Supabase. Guardar y códigos desactivados; puedes compartir por enlace.',
    'tbar.saved': 'Juego guardado.', 'tbar.needLogin': '<a href="{url}">Inicia sesión como profesor</a> para guardar y obtener un código.',
    'tbar.saveFail': 'No se pudo guardar: {e}', 'tbar.openNeedLogin': '<a href="{url}">Inicia sesión como profesor</a> para abrir un juego guardado.', 'tbar.notFound': 'Juego guardado no encontrado o no es tuyo.',
    'setup.try': '▶ Probar el juego', 'setup.code': '🎟 Crear código de alumno', 'setup.lb': '🏆 Clasificación', 'setup.example': 'Rellenar ejemplo',
    'home.sub': 'El profesor prepara las preguntas, los alumnos entran con un código y la clase compite.',
    'home.studentTitle': '🎟 ¿Eres alumno?', 'home.studentSub': 'Escribe el código de 5 letras que tu profesor puso en la pizarra.', 'home.join': 'Entrar', 'home.searching': 'Buscando…',
    'home.codeLen': 'El código debe tener 5 caracteres.', 'home.codeOff': 'Los códigos de juego aún no están activos.', 'home.codeNotFound': 'No hay ningún juego con este código. Revísalo.', 'home.netFail': 'Error de conexión. Revisa internet e inténtalo de nuevo.',
    'home.teacherTitle': '👩‍🏫 Acceso profesor', 'home.teacherSub': 'Las cuentas las crea el administrador.', 'home.user': 'Usuario', 'home.pass': 'Contraseña', 'home.login': 'Iniciar sesión', 'home.loggingIn': 'Iniciando sesión…',
    'home.noSb': 'Para iniciar sesión falta la configuración de Supabase.', 'home.needBoth': 'Se necesitan usuario y contraseña.', 'home.badLogin': 'Usuario o contraseña incorrectos.',
    'home.myGames': 'Mis juegos', 'home.saved': 'Juegos guardados', 'home.listFail': 'No se pudo cargar la lista: {e}', 'home.noGames': 'Aún no hay juegos guardados. Elige un tipo de juego arriba, escribe las preguntas y pulsa "Guardar".',
    'home.colGame': 'Juego', 'home.colTitle': 'Nombre', 'home.colCode': 'Código', 'home.colDate': 'Actualizado', 'home.untitled': '(sin nombre)', 'home.showCode': '🎟 Ver código', 'home.edit': '✏ Editar',
    'home.delConfirm': '¿Eliminar "{t}"? El código dejará de funcionar.', 'home.delFail': 'No se pudo eliminar: {e}', 'home.footer': 'A los alumnos solo se les pide nombre y clase. Las puntuaciones se guardan para la clase.',
    'game.balon.name': 'Explota globos', 'game.balon.desc': 'Explota los globos con respuestas correctas', 'game.puzzle.name': 'Puzle de letras', 'game.puzzle.desc': 'Mira la imagen y ordena las letras',
    'balon.title': '🎈 Explota <span>globos</span>', 'balon.sub': 'Escribe la pregunta y las respuestas. Los globos con respuestas correctas se explotan; los incorrectos no se tocan.',
    'balon.q': 'Pregunta / Instrucción <small>(se ve en grande arriba del juego)</small>', 'balon.qPh': 'Ej.: ¿Cuáles de estos son mamíferos?',
    'balon.correct': '✅ Respuestas correctas <small>(una por línea)</small>', 'balon.correctPh': 'Ballena\nMurciélago\nElefante', 'balon.wrong': '❌ Respuestas incorrectas <small>(una por línea)</small>', 'balon.wrongPh': 'Tiburón\nPingüino\nCocodrilo',
    'balon.speed': 'Velocidad', 'balon.speed1': 'Lenta', 'balon.speed2': 'Normal', 'balon.speed3': 'Rápida', 'balon.speed4': 'Muy rápida',
    'balon.lives': 'Vidas', 'balon.unlimited': 'Ilimitadas', 'balon.duration': 'Tiempo', 'balon.noTime': 'Sin límite', 'balon.sec': '{s} segundos', 'balon.min2': '2 minutos',
    'balon.hint': 'Para ganar hay que explotar todos los globos correctos. Explotar uno incorrecto cuesta una vida.',
    'balon.errCorrect': 'Añade al menos una respuesta correcta.', 'balon.errWrong': 'Añade al menos una respuesta incorrecta.', 'balon.errDup': 'Hay una respuesta en las dos listas: {d}',
    'balon.rules': 'Explota los globos con respuestas correctas: <b class="ok">+10 puntos</b>. Tocar uno incorrecto cuesta <b class="bad">una vida</b>.', 'balon.default': '¡Explota los globos correctos!',
    'balon.wrongPop': '¡Mal!', 'balon.paused': 'En pausa', 'balon.resume': '▶ Continuar', 'balon.quit': 'Salir',
    'balon.perfect': '¡Perfecto!', 'balon.perfectMsg': 'Explotaste todos los globos correctos sin ningún fallo.', 'balon.wonMsg': 'Explotaste todos los globos correctos con {w} fallos.',
    'balon.lost': 'Sin vidas', 'balon.lostMsg': 'Encontraste {g} de {t} respuestas correctas. ¡Inténtalo otra vez!', 'balon.timeout': 'Se acabó el tiempo', 'balon.timeoutMsg': 'Explotaste {g} de {t} respuestas correctas.',
    'balon.missed': 'Respuestas correctas sin explotar:',
    'balon.exQ': '¿Cuáles de estos son mamíferos?', 'balon.exCorrect': 'Ballena|Murciélago|Elefante|Delfín|Canguro', 'balon.exWrong': 'Tiburón|Pingüino|Cocodrilo|Lagarto|Águila|Rana|Pulpo',
    'puzzle.title': '🧩 Puzle de <span>letras</span>', 'puzzle.sub': 'Añade una imagen (o emoji) y su palabra por cada pregunta. Las letras se reparten como piezas de puzle y el alumno las ordena.',
    'puzzle.items': 'Preguntas <small>(todas las que quieras; las imágenes del ordenador se guardan reducidas)</small>', 'puzzle.add': '+ Añadir pregunta', 'puzzle.noItems': 'Aún no hay preguntas. Empieza con "Añadir pregunta".',
    'puzzle.pick': 'Elegir imagen', 'puzzle.imgPh': 'Elige una imagen ↖ o escribe un emoji / URL de imagen', 'puzzle.wordPh': 'La palabra (ej.: ELEFANTE)', 'puzzle.remove': 'Quitar', 'puzzle.imgFail': 'No se pudo leer la imagen.',
    'puzzle.order': 'Orden de preguntas', 'puzzle.random': 'Aleatorio', 'puzzle.fixed': 'Como se escribió', 'puzzle.time': 'Tiempo por pregunta', 'puzzle.noTime': 'Sin límite', 'puzzle.sec': '{s} s',
    'puzzle.extra': 'Letras extra', 'puzzle.none': 'Ninguna', 'puzzle.letters': '{n} letras', 'puzzle.hint': 'Pista', 'puzzle.firstLetter': 'Primera letra visible',
    'puzzle.help': 'Cuando el alumno pulsa "Listo" se comprueba la respuesta; si falla, se muestra la palabra correcta y pasa a la siguiente.',
    'puzzle.errEmpty': 'Añade al menos una pregunta (imagen + palabra).', 'puzzle.errShort': '"{w}" es muy corta; mínimo 2 letras.', 'puzzle.errLong': '"{w}" es muy larga; máximo 16 letras.',
    'puzzle.rules': 'Mira la imagen y toca las piezas de letras para formar la palabra. Cada palabra correcta da <b class="ok">+10 puntos</b>, con bonus por rapidez.',
    'puzzle.summary': 'Puzle de letras · {n} palabras', 'puzzle.writeWord': 'Escribe la palabra', 'puzzle.undo': '⌫ Borrar', 'puzzle.shuffle': '🔀 Mezclar', 'puzzle.ok': '✔ Listo',
    'puzzle.fillAll': 'Coloca primero todas las letras.', 'puzzle.right': '¡Correcto! +{p}', 'puzzle.wrongIs': 'Mal. Era: <b>{w}</b>', 'puzzle.timeIs': 'Tiempo agotado. Era: <b>{w}</b>',
    'puzzle.quitConfirm': '¿Salir del juego? La puntuación no se guardará.', 'puzzle.perfect': '¡Perfecto!', 'puzzle.perfectMsg': 'Escribiste todas las palabras bien.', 'puzzle.overMsg': 'Escribiste bien {c} de {t} palabras.',
    'puzzle.missed': 'Palabras mal escritas:',
    'puzzle.ex': '🐘:ELEFANTE|🍎:MANZANA|🚗:COCHE|🐱:GATO|🌙:LUNA|🍓:FRESA',
  },
  };

  const codes = LANGS.map(l => l[0]);
  function detect() {
    const q = new URLSearchParams(location.search).get('lang');
    if (codes.includes(q)) return q;
    try { const s = localStorage.getItem('egido_lang'); if (codes.includes(s)) return s; } catch (e) {}
    const nav = (navigator.language || 'tr').slice(0, 2).toLowerCase();
    return codes.includes(nav) ? nav : 'tr';
  }
  let lang = detect();
  function t(key, vars) {
    let s = (D[lang] && D[lang][key]) || D.tr[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('select.langsel').forEach(sel => { sel.value = lang; });
    document.documentElement.lang = lang;
  }
  function set(l, opts) {
    if (!codes.includes(l) || l === lang && !(opts && opts.force)) return;
    lang = l;
    try { localStorage.setItem('egido_lang', l); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent('egido:lang', { detail: { lang } }));
  }
  function selectorHtml(cls) {
    return `<select class="langsel ${cls || ''}" title="${t('lang')}">` + LANGS.map(([c, n]) => `<option value="${c}" ${c === lang ? 'selected' : ''}>${n}</option>`).join('') + '</select>';
  }
  function bindSelectors(root) {
    (root || document).querySelectorAll('select.langsel').forEach(sel => { sel.onchange = () => set(sel.value); });
  }
  document.addEventListener('DOMContentLoaded', () => { apply(); bindSelectors(); });
  return { t, apply, set, selectorHtml, bindSelectors, LANGS, get lang() { return lang; }, get codes() { return codes; } };
})();
