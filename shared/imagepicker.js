// Egido resim seçici: Bilgisayardan dosya / Emoji / Pixabay araması.
// Kullanım: ImagePicker.open({ onPick: img => {...} })  → img: 'data:image/jpeg;base64,…' | 'emoji:🐘' | 'https://…'
// Pixabay anahtarı shared/config.js içinde `pixabayKey`. Arama dili arayüz diliyle aynı (tr/en/de/es).
// Seçilen fotoğraf indirilip küçültülerek base64 gömülür (Pixabay kuralı: kalıcı hotlink yok). CORS engellenirse adres kullanılır.
window.ImagePicker = (() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = (window.BP_CONFIG || {}).pixabayKey || '';
  let onPick = null, page = 1, lastQ = '';

  function inject() {
    if ($('#ipOverlay')) return;
    const el = document.createElement('div');
    el.id = 'ipOverlay'; el.className = 'hidden';
    el.innerHTML = `
<div class="card ip">
  <div class="ip-head">
    <h2 data-i18n="pick.title"></h2>
    <div class="ip-tabs">
      <button class="ip-tab active" data-tab="search" data-i18n="pick.search"></button>
      <button class="ip-tab" data-tab="emoji" data-i18n="pick.emoji"></button>
      <button class="ip-tab" data-tab="file" data-i18n="pick.file"></button>
    </div>
  </div>
  <div class="ip-pane" data-pane="search">
    <form class="ip-search" id="ipForm"><input type="text" id="ipQ" data-i18n-ph="pick.searchPh" autocomplete="off"><button class="btn" type="submit" data-i18n="pick.go"></button></form>
    <div class="ip-grid" id="ipGrid"></div>
    <div class="ip-foot"><span id="ipStatus"></span><button class="btn small secondary hidden" id="ipMore" data-i18n="pick.more"></button><span class="ip-credit" data-i18n="pick.credit"></span></div>
  </div>
  <div class="ip-pane hidden" data-pane="emoji">
    <p class="hint" data-i18n="pick.emojiHint"></p>
    <div class="ip-emoji-row"><input type="text" id="ipEmoji" data-i18n-ph="pick.emojiPh" maxlength="8"><button class="btn" id="ipEmojiUse" data-i18n="pick.use"></button></div>
    <div class="ip-emoji-grid" id="ipEmojiGrid"></div>
  </div>
  <div class="ip-pane hidden" data-pane="file">
    <p class="hint" data-i18n="pick.fileHint"></p>
    <button class="btn" id="ipFileBtn" data-i18n="pick.fileBtn"></button>
    <input type="file" id="ipFile" accept="image/*" class="hidden">
  </div>
  <div class="row" style="justify-content:flex-end"><button class="btn secondary" id="ipClose" data-i18n="close"></button></div>
</div>`;
    document.body.appendChild(el);
    const EMOJIS = '🐘🐱🐶🐭🐰🦊🐻🐼🐨🦁🐯🐮🐷🐸🐵🐔🐧🐦🦆🦉🐴🦄🐝🐛🦋🐌🐞🐢🐍🐙🦀🐟🐬🐳🐊🦒🦓🦘🦔🐿️🍎🍐🍊🍋🍌🍉🍇🍓🍒🍑🥝🍅🥕🌽🥦🥔🧅🍞🧀🥚🍕🍔🌭🍦🍰🍪🍫☀️🌙⭐☁️🌧️❄️🌈🔥💧🌊🌳🌲🌵🌸🌻🍄🌍⛰️🏠🏫🏥🚗🚌🚲🚂✈️🚀⛵🚒🚑🚜⚽🏀🎾🎸🎹🎨📚✏️📱💻⌚🔑🎁🎈🧸🪁🎲👑👓👒👕👖👟🧢🪥🧼🛏️🪑🚪🔔⏰🔨✂️';
    const segs = (window.Intl && Intl.Segmenter) ? [...new Intl.Segmenter().segment(EMOJIS)].map(s => s.segment) : [...EMOJIS];
    $('#ipEmojiGrid').innerHTML = segs.filter(x => x.trim()).map(e => `<button class="ip-emoji" data-e="${e}">${e}</button>`).join('');

    el.querySelectorAll('.ip-tab').forEach(b => b.onclick = () => {
      el.querySelectorAll('.ip-tab').forEach(x => x.classList.toggle('active', x === b));
      el.querySelectorAll('.ip-pane').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== b.dataset.tab));
      if (b.dataset.tab === 'search') $('#ipQ').focus();
    });
    $('#ipClose').onclick = close;
    el.addEventListener('click', e => { if (e.target === el) close(); });
    $('#ipForm').onsubmit = e => { e.preventDefault(); search($('#ipQ').value.trim(), 1); };
    $('#ipMore').onclick = () => search(lastQ, page + 1);
    $('#ipEmojiUse').onclick = () => { const v = $('#ipEmoji').value.trim(); if (v) pick('emoji:' + v); };
    $('#ipEmojiGrid').onclick = e => { const b = e.target.closest('.ip-emoji'); if (b) pick('emoji:' + b.dataset.e); };
    $('#ipFileBtn').onclick = () => { $('#ipFile').value = ''; $('#ipFile').click(); };
    $('#ipFile').onchange = () => { const f = $('#ipFile').files[0]; if (f) fileToData(URL.createObjectURL(f), true).then(pick).catch(() => status(t('puzzle.imgFail'))); };
    if (window.I18N) I18N.apply(el);
    document.addEventListener('egido:lang', () => { if (window.I18N) I18N.apply(el); });
  }

  function status(msg) { $('#ipStatus').textContent = msg || ''; }
  function pick(img) { close(); if (onPick) onPick(img); }
  function open(opts) { inject(); onPick = opts.onPick; $('#ipOverlay').classList.remove('hidden'); if (!KEY) { status(t('pick.noKey')); $('#ipGrid').innerHTML = ''; } setTimeout(() => $('#ipQ').focus(), 50); }
  function close() { const el = $('#ipOverlay'); if (el) el.classList.add('hidden'); }

  // Resmi en fazla 420 px'e küçültüp JPEG base64 yap (ayarların içinde taşınır)
  function fileToData(src, revoke) {
    return new Promise((res, rej) => {
      const im = new Image(); if (!revoke) im.crossOrigin = 'anonymous';
      im.onload = () => {
        try {
          const MAX = 420, sc = Math.min(1, MAX / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', .82));
        } catch (e) { rej(e); } finally { if (revoke) URL.revokeObjectURL(src); }
      };
      im.onerror = () => { if (revoke) URL.revokeObjectURL(src); rej(new Error('load')); };
      im.src = src;
    });
  }

  async function search(q, p) {
    if (!q) return;
    if (!KEY) { status(t('pick.noKey')); return; }
    lastQ = q; page = p;
    status(t('loading')); $('#ipMore').classList.add('hidden');
    if (p === 1) $('#ipGrid').innerHTML = '';
    const lang = window.I18N && ['tr', 'en', 'de', 'es'].includes(I18N.lang) ? I18N.lang : 'en';
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(KEY)}&q=${encodeURIComponent(q)}&lang=${lang}&image_type=all&safesearch=true&per_page=24&page=${p}`;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      if (!d.hits.length && p === 1) { status(t('pick.none')); return; }
      $('#ipGrid').insertAdjacentHTML('beforeend', d.hits.map(h => `<button class="ip-item" data-src="${esc(h.webformatURL)}" title="${esc(h.tags)}"><img src="${esc(h.previewURL)}" alt="${esc(h.tags)}" loading="lazy"></button>`).join(''));
      $('#ipGrid').querySelectorAll('.ip-item:not([data-wired])').forEach(b => { b.dataset.wired = 1; b.onclick = () => choose(b.dataset.src); });
      status(t('pick.count', { n: Math.min(d.totalHits, p * 24), t: d.totalHits }));
      if (p * 24 < d.totalHits) $('#ipMore').classList.remove('hidden');
    } catch (e) { status(t('pick.fail')); }
  }
  async function choose(src) {
    status(t('loading'));
    try { pick(await fileToData(src, false)); }          // indirip küçült ve göm
    catch (e) { pick(src); }                              // CORS engeli: adresi kullan
  }

  return { open, close, fileToData };
})();
