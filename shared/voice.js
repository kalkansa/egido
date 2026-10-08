// Kara Tahta (Egido) — sesle yazma.
// Öğretmenin soru/cevap kutularına (#setup içi) ve yapay zekâ penceresindeki konu kutusuna (#aiTopic)
// odaklanınca kutunun sağ ucunda 🎤 + dil etiketi belirir. 🎤'ya basıp konuşulan metin imlecin olduğu yere yazılır.
// Web Speech API (SpeechRecognition): Chrome, Edge, Safari. Desteklemeyen tarayıcıda (Firefox) hiçbir şey görünmez.
// Oyun, bazı kutular için dili kendisi seçebilir: EgidoVoice.langOf = el => 'de' | null
(() => {
  'use strict';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LOCALE = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES' };
  const ORDER = ['tr', 'en', 'de', 'es'];
  const KEY = 'egido-voice-lang';
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const api = { ok: !!SR, langOf: null };
  window.EgidoVoice = api;
  if (!SR) return;

  let target = null, box = null, rec = null, listening = false, hideTimer = null, tipTimer = null, raf = 0;

  function eligible(el) {
    if (!el || !el.tagName) return false;
    const isTa = el.tagName === 'TEXTAREA', isIn = el.tagName === 'INPUT' && ['text', 'search', ''].includes((el.getAttribute('type') || '').toLowerCase());
    if (!isTa && !isIn) return false;
    if (el.readOnly || el.disabled || el.hasAttribute('data-novoice')) return false;
    if (el.id === 'aiTopic') return true;
    if (el.id === 'aiPaste' || el.id === 'gameTitle' || el.id === 'shareUrl' || /^ip/.test(el.id)) return false;
    return !!el.closest('#setup');
  }
  // Çok satırlı listelerde (Balon/Gol: her satıra bir cevap) her dikte yeni satıra yazılır
  const narrow = el => el.getBoundingClientRect().width < 240;
  const lineMode = el => el.tagName === 'TEXTAREA' && el.id !== 'aiTopic';

  function savedLang() { try { const s = localStorage.getItem(KEY); if (LOCALE[s]) return s; } catch (e) {} return window.I18N && LOCALE[I18N.lang] ? I18N.lang : 'tr'; }
  function forcedLang(el) { try { const l = api.langOf && api.langOf(el); return LOCALE[l] ? l : null; } catch (e) { return null; } }
  const langFor = el => forcedLang(el) || savedLang();

  function build() {
    box = document.createElement('div'); box.className = 'vx hidden';
    box.innerHTML = '<button type="button" class="vx-mic" aria-label="mic">🎤</button><button type="button" class="vx-lang"></button><div class="vx-tip hidden"></div>';
    document.body.appendChild(box);
    // Kutudaki odak kaybolmasın (mobilde klavye kapanmasın)
    box.addEventListener('mousedown', e => e.preventDefault());
    box.addEventListener('touchstart', () => clearTimeout(hideTimer), { passive: true });
    box.querySelector('.vx-mic').addEventListener('click', () => { if (listening) stop(); else start(); });
    box.querySelector('.vx-lang').addEventListener('click', () => {
      if (!target || forcedLang(target)) return;
      const next = ORDER[(ORDER.indexOf(savedLang()) + 1) % ORDER.length];
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
      if (listening) { stop(); setTimeout(start, 150); }
    });
  }
  function paint() {
    if (!box || !target) return;
    const forced = forcedLang(target), l = langFor(target);
    const lb = box.querySelector('.vx-lang');
    lb.textContent = l.toUpperCase(); lb.disabled = !!forced;
    lb.title = forced ? t('voice.langFixed') : t('voice.lang');
    const mic = box.querySelector('.vx-mic');
    mic.title = listening ? t('voice.stop') : t('voice.title');
    box.classList.toggle('on', listening);
  }
  function place() {
    raf = 0;
    if (!box || !target) return;
    if (!document.contains(target) || target.offsetParent === null) { hide(true); return; }
    const r = target.getBoundingClientRect(), bw = box.offsetWidth || 70, bh = box.offsetHeight || 30;
    // Dar kutularda (telefonda cevap kutuları) içeride yazıya yer kalmıyor: kutunun sağ üst köşesinin üstüne çık
    const top = narrow(target) ? r.top - bh - 3 : target.tagName === 'TEXTAREA' ? r.bottom - bh - 4 : r.top + (r.height - bh) / 2;
    box.style.left = Math.max(4, r.right - bw - (narrow(target) ? 0 : 4)) + 'px';
    box.style.top = Math.max(4, top) + 'px';
    raf = requestAnimationFrame(place); // satırlar yeniden çizilir, sayfa kayar, pencere açılır: konum her karede güncel
  }
  function show(el) {
    if (!box) build();
    clearTimeout(hideTimer);
    if (target && target !== el) { if (listening) stop(); target.classList.remove('vx-pad'); }
    target = el; el.classList.toggle('vx-pad', !narrow(el));
    box.classList.remove('hidden'); paint();
    if (!raf) raf = requestAnimationFrame(place);
  }
  function hide(now) {
    clearTimeout(hideTimer);
    const go = () => {
      if (listening && !now) return;
      if (listening) stop();
      if (target) target.classList.remove('vx-pad');
      target = null; if (box) box.classList.add('hidden');
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    if (now) go(); else hideTimer = setTimeout(go, 250);
  }
  function tip(msg, ms) {
    if (!box) return;
    const el = box.querySelector('.vx-tip');
    clearTimeout(tipTimer);
    if (!msg) { el.classList.add('hidden'); return; }
    el.textContent = msg; el.classList.remove('hidden');
    if (ms) tipTimer = setTimeout(() => el.classList.add('hidden'), ms);
  }

  function write(el, text) {
    const max = el.maxLength > 0 ? el.maxLength : Infinity;
    el.value = text.length > max ? text.slice(0, max) : text;
    el.dispatchEvent(new Event('input', { bubbles: true })); // oyunların oninput'u durumu güncellesin
  }
  function clean(s, el) {
    s = s.replace(/\s+/g, ' ').trim();
    if (el.tagName === 'INPUT' || lineMode(el)) s = s.replace(/[.。]+$/, ''); // tek cevaplarda sondaki nokta istenmez
    return s;
  }

  function start() {
    const el = target; if (!el) return;
    const v = el.value, a = el.selectionStart != null ? el.selectionStart : v.length, b = el.selectionEnd != null ? el.selectionEnd : v.length;
    const before = v.slice(0, a), after = v.slice(b);
    const sep = !before ? '' : lineMode(el) ? (before.endsWith('\n') ? '' : '\n') : (/\s$/.test(before) ? '' : ' ');
    const tail = lineMode(el) && after && !after.startsWith('\n') ? '\n' : (!lineMode(el) && after && !/^\s/.test(after) ? ' ' : '');
    let got = false;
    try {
      rec = new SR();
      rec.lang = LOCALE[langFor(el)]; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    } catch (e) { tip(t('voice.fail', { e: e.message || e }), 4000); return; }
    rec.onresult = e => {
      let txt = ''; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      txt = clean(txt, el); if (!txt) return;
      got = true; tip('');
      write(el, before + sep + txt + tail + after);
      const pos = Math.min(el.value.length, (before + sep + txt).length);
      try { el.setSelectionRange(pos, pos); } catch (err) {}
    };
    rec.onerror = e => {
      const c = e.error;
      if (c === 'aborted') return;
      got = true; // onend "anlaşılmadı" demesin
      tip(c === 'not-allowed' || c === 'service-not-allowed' ? t('voice.denied') : c === 'no-speech' ? t('voice.noSpeech') : c === 'audio-capture' ? t('voice.noMic') : c === 'network' ? t('voice.network') : t('voice.fail', { e: c }), 5000);
    };
    rec.onend = () => {
      listening = false; rec = null; paint();
      if (!got) tip(t('voice.noSpeech'), 3500);
      if (target === el && document.activeElement !== el) { try { el.focus({ preventScroll: true }); } catch (err) {} }
    };
    try { rec.start(); } catch (e) { tip(t('voice.fail', { e: e.message || e }), 4000); rec = null; return; }
    listening = true; paint(); tip(t('voice.listening'));
  }
  function stop() { if (rec) { try { rec.stop(); } catch (e) {} } }

  document.addEventListener('focusin', e => { if (eligible(e.target)) show(e.target); else if (box && !box.contains(e.target)) hide(); });
  document.addEventListener('focusout', e => { if (e.target === target) hide(); });
  document.addEventListener('egido:lang', paint);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && listening) stop(); });
})();
