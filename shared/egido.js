// Egido ortak çekirdek. Her oyun yalnızca kendi sahnesini yazar; şunları bu dosya yapar:
// öğretmen çubuğu (giriş durumu, oyun adı, kaydet, dil), öğrenci giriş ekranı (ad + sınıf),
// oyun kodu + QR paylaşımı, skor tablosu, Supabase bağlantısı, sesler, geri sayım, çok dil.
//
// Oyun sayfası şunları yükler (sırayla): ../../shared/config.js, supabase-js (UMD), qrcode.min.js,
// ../../shared/i18n.js, ../../shared/egido.css, ../../shared/egido.js — sonra Egido.init({...}) çağırır.
//
//   Egido.init({
//     gameId:      'balon',                 // skorlar ve kayıtlı oyunlar bu kimlikle ayrışır
//     emoji:       '🎈',
//     introRules:  () => I18N.t('...'),     // öğrenci giriş ekranındaki kural metni (HTML); dil değişince yeniden çağrılır
//     readConfig:  () => ({...}),           // öğretmen panelinden ayarları oku
//     writeConfig: cfg => {...},            // ayarları panele yaz (kayıtlı oyun / kod / bağlantı ile gelince)
//     validate:    cfg => '' | 'hata',      // boş dize = geçerli
//     summary:     cfg => 'Başlık',         // giriş ekranı başlığı ve varsayılan oyun adı
//     startGame:   cfg => {...},            // #game ekranı gösterildikten sonra çağrılır
//   })
//   Oyun bitince: Egido.finish({ kind, score, correct, total, wrong, time, emoji, title, msg, missed, missedTitle })
//
// Sayfada olması gerekenler: #setup içinde #teacherBarHost, #btnStart, #btnShare, #btnLbSetup, #setupErr,
// #sharePanelHost; bir #game ekranı; isteğe bağlı #countdown.
window.Egido = (() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- Supabase ----------
  const SB = window.BP_CONFIG || {};
  const remote = !!(SB.supabaseUrl && SB.supabaseAnonKey && window.supabase);
  const sb = remote ? window.supabase.createClient(SB.supabaseUrl, SB.supabaseAnonKey) : null;
  const storeLabel = () => (remote ? 'Supabase' : t('store.local'));
  let session = null;
  const ROOT_URL = location.origin + location.pathname.replace(/games\/[^/]+\/?(index\.html)?$/, '');
  const shortJoin = ROOT_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

  let o = null;                 // init seçenekleri
  let currentSid = '';          // skor tablosu oturumu (config.sid)
  let currentSetId = null;      // kayıtlı oyunun id'si (öğretmen)
  let currentCode = '';         // kayıtlı oyunun kodu
  let playSetId = null;         // oynanan kayıtlı oyunun id'si (skora yazılır, son oynanma güncellenir)
  let isTeacher = true;
  let cfg = null;               // oynanan ayarlar
  let player = { name: '', cls: '' };
  try { player = Object.assign(player, JSON.parse(localStorage.getItem('egido_player') || '{}')); } catch (e) {}

  // ---------- Ortak ekranlar ----------
  function injectScreens() {
    const langSel = window.I18N ? I18N.selectorHtml() : '';
    const tpl = document.createElement('div');
    tpl.innerHTML = `
<div id="intro" class="screen hidden">
  <div class="card intro">
    <div class="langrow">${langSel}</div>
    <div style="font-size:60px" id="introEmoji">🎮</div>
    <div class="q" id="introQ"></div>
    <div class="rule" id="introRules"></div>
    <div class="cols">
      <div><label for="pName" data-i18n="intro.name"></label><input type="text" id="pName" data-i18n-ph="intro.namePh" maxlength="40" autocomplete="off"></div>
      <div><label for="pClass" data-i18n="intro.cls"></label><input type="text" id="pClass" data-i18n-ph="intro.clsPh" maxlength="12" autocomplete="off" list="classList"><datalist id="classList"></datalist></div>
    </div>
    <div class="err" id="introErr"></div>
    <button class="btn big" id="btnIntroStart" data-i18n="intro.start"></button>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn secondary" id="btnLbIntro" data-i18n="intro.lb"></button></div>
    <div class="hint" style="margin-top:16px"><a href="#" id="editLink" style="color:var(--muted)" data-i18n="intro.teacher"></a></div>
  </div>
</div>
<div id="result" class="screen hidden">
  <div class="card result">
    <div class="big-emoji" id="resEmoji">🏆</div>
    <h2 id="resTitle"></h2>
    <p class="msg" id="resMsg"></p>
    <div class="stats">
      <div class="stat"><div class="v" id="rScore">0</div><div class="k" data-i18n="res.score"></div></div>
      <div class="stat"><div class="v" id="rCorrect">0</div><div class="k" data-i18n="res.correct"></div></div>
      <div class="stat"><div class="v" id="rWrong">0</div><div class="k" data-i18n="res.wrong"></div></div>
      <div class="stat"><div class="v" id="rTime">0</div><div class="k" data-i18n="res.time"></div></div>
    </div>
    <div class="missed hidden" id="missedBox"><b id="missedTitle"></b><div class="chips" id="missedChips"></div></div>
    <div class="myrank" id="myRank"></div>
    <div class="lb-wrap" id="resLb"></div>
    <div class="row" style="justify-content:center">
      <button class="btn" id="btnAgain" data-i18n="res.again"></button>
      <button class="btn secondary" id="btnChangePlayer" data-i18n="res.changePlayer"></button>
      <button class="btn secondary" id="btnSetup" data-i18n="res.settings"></button>
    </div>
  </div>
</div>
<div id="lbOverlay" class="hidden">
  <div class="card" style="width:min(640px,94vw)">
    <div class="lb-head"><h2 data-i18n="lb.title"></h2><select id="lbClass"><option value="" data-i18n="lb.all"></option></select></div>
    <div class="lb-wrap" id="lbBody"></div>
    <div class="row"><button class="btn" id="btnLbClose" data-i18n="close"></button><button class="btn secondary" id="btnLbClear" data-i18n="lb.new"></button></div>
  </div>
</div>
<div id="bigShare" class="hidden">
  <div class="big-label" data-i18n="share.bigLabel"></div>
  <div class="big-join" id="bigJoin"></div>
  <div class="big-code" id="bigCode"></div>
  <div id="bigQr"></div>
  <button class="btn secondary" id="btnBigClose" data-i18n="close"></button>
</div>
<div class="toast" id="toast"></div>`;
    while (tpl.firstChild) document.body.appendChild(tpl.firstChild);

    const host = $('#sharePanelHost');
    if (host) host.innerHTML = `
<div id="sharePanel" class="share hidden">
  <div class="share-left">
    <div class="share-label" data-i18n="share.label"></div>
    <div class="share-code" id="shareCode">—</div>
    <div class="share-join" id="shareJoin"></div>
    <input type="text" id="shareUrl" readonly onclick="this.select()">
    <div class="row" style="margin-top:10px">
      <button class="btn secondary" id="btnCopyUrl" data-i18n="share.copy"></button>
      <button class="btn secondary" id="btnBigShare" data-i18n="share.big"></button>
    </div>
  </div>
  <div class="share-qr"><div id="qr"></div><div class="hint" style="text-align:center;margin-top:6px" data-i18n="share.scan"></div></div>
</div>`;

    const tb = $('#teacherBarHost');
    if (tb) tb.innerHTML = remote ? `
<div class="tbar">
  <input type="text" id="gameTitle" data-i18n-ph="tbar.titlePh" maxlength="120">
  <button class="btn small ok" id="btnSave" data-i18n="tbar.save"></button>
  <span class="tbar-user" id="tbUser"></span>
</div>` : `<div class="tbar tbar-local"><span data-i18n="tbar.local"></span>${langSel}</div>`;

    if (window.I18N) { I18N.apply(); I18N.bindSelectors(); }
  }

  function show(name) {
    for (const k of ['setup', 'intro', 'game', 'result']) { const el = $('#' + k); if (el) el.classList.toggle('hidden', k !== name); }
    if (window.EgidoHeader) EgidoHeader.setVisible(name === 'setup'); // başlık yalnızca öğretmen panelinde
  }
  let toastT;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }

  // ---------- Ayar yardımcıları ----------
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const newSid = () => Math.random().toString(36).slice(2, 8);
  const enc = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const dec = s => JSON.parse(decodeURIComponent(escape(atob(s))));
  function readConfig() {
    if (!currentSid) currentSid = newSid();
    return Object.assign(o.readConfig(), { sid: currentSid, lang: window.I18N ? I18N.lang : 'tr' });
  }
  function writeConfig(c) { if (c.sid) currentSid = String(c.sid); o.writeConfig(c); }
  function fingerprint(c) { const x = Object.assign({}, c); delete x.sid; delete x.lang; return hash(JSON.stringify(x)); }
  const setKey = c => o.gameId + ':' + fingerprint(c) + '-' + (c.sid || '0');
  function setErr(msg) { $('#setupErr').innerHTML = msg || ''; }
  // Öğrenci, öğretmenin seçtiği dille açar
  function applyCfgLang(c) { if (window.I18N && c && c.lang && I18N.codes.includes(c.lang)) I18N.set(c.lang); }

  // ---------- Skor deposu ----------
  const cmpScore = (a, b) => b.score - a.score || b.correct - a.correct || a.time - b.time || a.date - b.date;
  const sameP = (a, b) => a.name.toLowerCase() === b.name.toLowerCase() && a.cls.toLowerCase() === b.cls.toLowerCase();
  function bestPerPlayer(list) { const out = []; for (const e of list.slice().sort(cmpScore)) if (!out.some(x => sameP(x, e))) out.push(e); return out; }
  const LocalStore = {
    async list(c) { try { return bestPerPlayer(JSON.parse(localStorage.getItem('egido_lb_' + setKey(c)) || '[]')); } catch (e) { return []; } },
    async add(c, entry) {
      const list = bestPerPlayer([...(await this.list(c)), entry]).slice(0, 500);
      try { localStorage.setItem('egido_lb_' + setKey(c), JSON.stringify(list)); } catch (e) {}
      return list;
    },
  };
  const RemoteStore = {
    async list(c) {
      const { data, error } = await sb.from('scores').select('name,cls,score,correct,total,wrong,time_sec,result,created_at')
        .eq('set_key', setKey(c)).order('score', { ascending: false }).order('correct', { ascending: false }).order('time_sec').limit(1000);
      if (error) throw error;
      return bestPerPlayer(data.map(x => ({ name: x.name, cls: x.cls, score: x.score, correct: x.correct, total: x.total, wrong: x.wrong, time: x.time_sec, result: x.result, date: Date.parse(x.created_at) })));
    },
    async add(c, e) {
      const row = { game: o.gameId, set_key: setKey(c), name: e.name, cls: e.cls, score: e.score, correct: e.correct, total: e.total, wrong: e.wrong, time_sec: Math.round(e.time * 10) / 10, result: e.result };
      if (playSetId) row.set_id = playSetId; // kayıtlı oyunun son oynanma zamanı tetikleyiciyle güncellenir
      let { error } = await sb.from('scores').insert(row);
      if (error && row.set_id && error.code === '42703') { delete row.set_id; ({ error } = await sb.from('scores').insert(row)); } // şema henüz güncellenmediyse
      if (error) throw error;
      return this.list(c);
    },
  };
  const Store = remote ? RemoteStore : LocalStore;

  // ---------- Kayıtlı oyunlar (öğretmen) ----------
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  async function saveSet(opts = {}) {
    if (!remote) return null;
    if (!session) { setErr(t('tbar.needLogin', { url: ROOT_URL })); return null; }
    const c = readConfig(); const e = o.validate(c);
    if (e) { setErr(e); return null; }
    setErr('');
    const title = ($('#gameTitle').value.trim() || o.summary(c)).slice(0, 120);
    $('#gameTitle').value = title;
    const btn = $('#btnSave'); btn.disabled = true;
    try {
      if (currentSetId) {
        const { error } = await sb.from('sets').update({ title, config: c, updated_at: new Date().toISOString() }).eq('id', currentSetId);
        if (error) throw error;
      } else {
        let inserted = null;
        for (let i = 0; i < 6 && !inserted; i++) {
          const { data, error } = await sb.from('sets').insert({ owner: session.user.id, code: randomCode(), game: o.gameId, title, config: c }).select('id,code').single();
          if (!error) inserted = data;
          else if (error.code !== '23505') throw error; // 23505 = kod çakıştı, yeniden dene
        }
        if (!inserted) throw new Error('code');
        currentSetId = inserted.id; currentCode = inserted.code;
        history.replaceState(null, '', location.pathname + '?id=' + currentSetId);
      }
      if (!opts.silent) toast(t('tbar.saved'));
      return { id: currentSetId, code: currentCode };
    } catch (err) {
      setErr(t('tbar.saveFail', { e: escapeHtml(err.message || err) }));
      return null;
    } finally { btn.disabled = false; }
  }
  async function loadSet(id) {
    const { data, error } = await sb.from('sets').select('id,code,title,game,config').eq('id', id).single();
    if (error || !data) throw error || new Error('notfound');
    if (data.game !== o.gameId) { location.href = `${ROOT_URL}games/${encodeURIComponent(data.game)}/?id=${id}`; return null; }
    currentSetId = data.id; currentCode = data.code;
    writeConfig(data.config);
    $('#gameTitle').value = data.title || '';
    return data;
  }
  async function joinByCode(code) {
    const { data, error } = await sb.rpc('join_set', { p_code: code });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row && row.config ? row : null;
  }

  // ---------- Kod / QR paneli ----------
  function drawQr(el, text, size) {
    el.innerHTML = '';
    if (typeof QRCode === 'undefined') { el.innerHTML = `<div class="hint">${t('share.qrFail')}</div>`; return; }
    if (text.length > 2300) { el.innerHTML = `<div class="hint" style="max-width:180px">${t('share.tooLong')}</div>`; return; }
    new QRCode(el, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
  }
  function showSharePanel(code, url) {
    $('#shareCode').textContent = code || '—';
    $('#shareJoin').innerHTML = code ? t('share.join', { url: escapeHtml(shortJoin) }) : t('share.local');
    $('#shareUrl').value = url;
    drawQr($('#qr'), url, 180);
    $('#sharePanel').classList.remove('hidden');
    $('#sharePanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  async function share() {
    const c = readConfig(); const e = o.validate(c);
    if (e) { setErr(e); return; }
    setErr('');
    if (!remote) { showSharePanel('', location.origin + location.pathname + '#' + enc(c)); return; }
    const saved = await saveSet({ silent: true }); // kod, kayıtlı oyuna bağlıdır
    // QR ve bağlantı doğrudan oyuna gider; ana sayfa yalnızca kodu elle yazanlar için
    if (saved) showSharePanel(saved.code, location.origin + location.pathname + '?k=' + saved.code);
  }

  // ---------- Skor tablosu ----------
  const fmtTime = s => { s = Math.round(s); return s >= 60 ? t('time.min', { m: Math.floor(s / 60), s: s % 60 }) : t('time.sec', { s }); };
  function renderLb(list, me, clsFilter) {
    const rows = list.filter(e => !clsFilter || e.cls.toLowerCase() === clsFilter.toLowerCase());
    if (!rows.length) return `<div class="lb-empty">${t('lb.empty')}</div>`;
    const medal = ['🥇', '🥈', '🥉'];
    return `<table class="lb"><thead><tr><th></th><th>${t('lb.student')}</th><th style="text-align:right">${t('res.score')}</th><th style="text-align:right">${t('res.correct')}</th><th style="text-align:right">${t('res.time')}</th></tr></thead><tbody>` +
      rows.map((e, i) => `<tr class="${me && sameP(e, me) ? 'me' : ''}">
        <td class="rank">${medal[i] || (i + 1) + '.'}</td>
        <td>${escapeHtml(e.name)}<span class="cls">${escapeHtml(e.cls)}</span></td>
        <td class="num">${e.score}</td>
        <td class="num">${e.correct}/${e.total}${e.wrong ? ` <span style="color:var(--bad)">(${e.wrong}✗)</span>` : ''}</td>
        <td class="num">${fmtTime(e.time)}</td></tr>`).join('') + '</tbody></table>';
  }
  function fillClassOptions(list) {
    const classes = [...new Set(list.map(e => e.cls))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    $('#classList').innerHTML = classes.map(c => `<option value="${escapeHtml(c)}">`).join('');
    const sel = $('#lbClass'), cur = sel.value;
    sel.innerHTML = `<option value="">${t('lb.all')}</option>` + classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    if (classes.includes(cur)) sel.value = cur;
  }
  let lbCfg = null, lbList = [];
  async function openLeaderboard(c) {
    lbCfg = c;
    $('#btnLbClear').classList.toggle('hidden', !isTeacher);
    $('#lbBody').innerHTML = `<div class="lb-empty">${t('loading')}</div>`;
    $('#lbOverlay').classList.remove('hidden');
    try { lbList = await Store.list(c); }
    catch (e) { lbList = []; $('#lbBody').innerHTML = `<div class="lb-empty">${t('lb.fail', { store: storeLabel() })}</div>`; return; }
    fillClassOptions(lbList);
    $('#lbBody').innerHTML = renderLb(lbList, player, $('#lbClass').value);
  }

  // ---------- Giriş / başlatma ----------
  function renderIntroText() {
    if (cfg) $('#introQ').textContent = o.summary(cfg);
    $('#introRules').innerHTML = typeof o.introRules === 'function' ? o.introRules() : (o.introRules || '');
  }
  async function gotoIntro(c) {
    cfg = c;
    renderIntroText();
    $('#pName').value = player.name; $('#pClass').value = player.cls; $('#introErr').textContent = '';
    $('#btnIntroStart').disabled = false;
    show('intro');
    if (!player.name) $('#pName').focus();
    try { fillClassOptions(await Store.list(c)); } catch (e) {}
  }
  function launch(c) { cfg = c; if (!playSetId && currentSetId) playSetId = currentSetId; show('game'); o.startGame(c); }

  // ---------- Bitiş ----------
  function finish(r) {
    $('#resEmoji').textContent = r.emoji || (r.kind === 'win' ? '🏆' : '🎯');
    $('#resTitle').textContent = r.title || (r.kind === 'win' ? t('res.won') : r.kind === 'quit' ? t('res.quit') : t('res.over'));
    $('#resMsg').textContent = r.msg || '';
    $('#rScore').textContent = r.score; $('#rCorrect').textContent = `${r.correct}/${r.total}`;
    $('#rWrong').textContent = r.wrong; $('#rTime').textContent = fmtTime(r.time);
    const missed = r.missed || [];
    $('#missedBox').classList.toggle('hidden', !missed.length);
    $('#missedTitle').textContent = r.missedTitle || t('res.missed');
    $('#missedChips').innerHTML = missed.map(m => `<span class="chip">${escapeHtml(m)}</span>`).join('');
    show('result');
    saveAndShowRank(r);
  }
  async function saveAndShowRank(r) {
    $('#myRank').textContent = ''; $('#resLb').innerHTML = '';
    if (r.kind === 'quit') return;
    const entry = { name: player.name, cls: player.cls, score: r.score, correct: r.correct, total: r.total, wrong: r.wrong, time: r.time, result: r.kind, date: Date.now() };
    $('#myRank').textContent = t('res.saving');
    let list;
    try { list = await Store.add(cfg, entry); }
    catch (e) { $('#myRank').textContent = ''; $('#resLb').innerHTML = `<div class="lb-empty">${t('res.saveFail', { store: storeLabel() })}</div>`; return; }
    const mine = list.find(e => sameP(e, entry) && e.score === entry.score && Math.abs(e.time - entry.time) < 1) || list.find(e => sameP(e, entry));
    if (mine) entry.date = mine.date;
    const idx = list.findIndex(e => sameP(e, entry));
    if (idx >= 0) {
      const best = list[idx];
      $('#myRank').textContent = best.date === entry.date ? t('res.rank', { r: idx + 1, n: list.length }) : t('res.best', { b: best.score, r: idx + 1, s: entry.score });
    }
    $('#resLb').innerHTML = renderLb(list.slice(0, 10), entry, '');
    if (idx >= 10) $('#resLb').innerHTML += `<div class="lb-empty" style="padding:8px">${t('res.you', { r: idx + 1 })}</div>`;
  }

  // ---------- Ses ----------
  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type = 'sine', vol = .2, when = 0, slideTo = null) {
    const a = audio(); if (!a) return;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, a.currentTime + when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + when + dur);
    g.gain.setValueAtTime(vol, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + when + dur);
    osc.connect(g).connect(a.destination); osc.start(a.currentTime + when); osc.stop(a.currentTime + when + dur + .02);
  }
  function noise(dur = .08, vol = .5) {
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = vol;
    s.connect(g).connect(a.destination); s.start();
  }
  const sfx = {
    good() { noise(); tone(660, .12, 'triangle', .18, 0); tone(990, .18, 'triangle', .18, .09); },
    bad() { noise(); tone(180, .35, 'sawtooth', .22, 0, 90); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .2, i * .13)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, .35, 'sawtooth', .15, i * .22)); },
    tick() { tone(880, .06, 'square', .08); },
    click() { tone(520, .05, 'square', .06); },
  };
  function countdown(n, done, isAlive) {
    const el = $('#countdown'); if (!el) return done();
    el.classList.remove('hidden');
    const step = () => {
      if (isAlive && !isAlive()) { el.classList.add('hidden'); return; }
      if (n === 0) { el.textContent = t('go'); tone(1200, .3, 'triangle', .2); setTimeout(() => { el.classList.add('hidden'); done(); }, 500); return; }
      el.textContent = n; sfx.tick(); n--; setTimeout(step, 700);
    };
    step();
  }

  // ---------- Olaylar ----------
  function wire() {
    if (o.emoji) $('#introEmoji').textContent = o.emoji;
    renderIntroText();
    document.addEventListener('egido:lang', () => { renderIntroText(); if (lbCfg) fillClassOptions(lbList); });

    $('#btnStart').onclick = () => {
      const c = readConfig(); const e = o.validate(c);
      if (e) { setErr(e); return; }
      setErr(''); isTeacher = true; gotoIntro(c);
    };
    $('#btnLbSetup').onclick = () => {
      const c = readConfig(); const e = o.validate(c);
      if (e) { setErr(e); return; }
      setErr(''); openLeaderboard(c);
    };
    $('#btnShare').onclick = share;
    if ($('#btnSave')) $('#btnSave').onclick = () => saveSet();
    $('#btnCopyUrl').onclick = async () => {
      const url = $('#shareUrl').value;
      try { await navigator.clipboard.writeText(url); toast(t('share.copied')); }
      catch (e) { $('#shareUrl').focus(); $('#shareUrl').select(); toast(t('share.copyManual')); }
    };
    $('#btnBigShare').onclick = () => {
      const code = $('#shareCode').textContent.replace('—', '');
      $('#bigJoin').textContent = code ? shortJoin : t('share.scanQr');
      $('#bigCode').textContent = code;
      drawQr($('#bigQr'), $('#shareUrl').value, Math.min(360, Math.floor(window.innerHeight * .45)));
      $('#bigShare').classList.remove('hidden');
    };
    $('#btnBigClose').onclick = () => $('#bigShare').classList.add('hidden');

    $('#btnLbIntro').onclick = () => openLeaderboard(cfg || readConfig());
    $('#lbClass').onchange = () => { if (lbCfg) $('#lbBody').innerHTML = renderLb(lbList, player, $('#lbClass').value); };
    $('#btnLbClose').onclick = () => $('#lbOverlay').classList.add('hidden');
    $('#btnLbClear').onclick = async () => {
      if (!lbCfg) return;
      if (!confirm(t('lb.confirm'))) return;
      currentSid = newSid();
      const c = readConfig(); lbCfg = c; lbList = []; cfg = c;
      $('#lbBody').innerHTML = renderLb([], player, ''); fillClassOptions([]);
      if (remote && currentSetId && session) await saveSet({ silent: true }); // yeni sid kayıtlı oyuna işlensin
      toast(t('lb.started'));
    };
    $('#editLink').onclick = ev => { ev.preventDefault(); isTeacher = true; show('setup'); };
    $('#btnIntroStart').onclick = () => {
      const name = $('#pName').value.trim().replace(/\s+/g, ' '), cls = $('#pClass').value.trim().toLocaleUpperCase();
      if (name.length < 2) { $('#introErr').textContent = t('intro.errName'); $('#pName').focus(); return; }
      if (!cls) { $('#introErr').textContent = t('intro.errCls'); $('#pClass').focus(); return; }
      $('#introErr').textContent = '';
      player = { name, cls };
      try { localStorage.setItem('egido_player', JSON.stringify(player)); } catch (e) {}
      audio(); launch(cfg);
    };
    ['#pName', '#pClass'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') $('#btnIntroStart').click(); }));
    $('#btnAgain').onclick = () => launch(cfg);
    $('#btnChangePlayer').onclick = () => gotoIntro(cfg);
    $('#btnSetup').onclick = () => { isTeacher = true; show('setup'); };
  }

  function renderUser() {
    // Giriş varsa üst başlık (menü, dil, çıkış); yoksa çubukta giriş bağlantısı
    if (window.EgidoHeader) EgidoHeader.render({ session, sb, root: ROOT_URL, active: 'game' });
    const el = $('#tbUser'); if (!el) return;
    el.innerHTML = session ? '' : `<a href="${ROOT_URL}">${t('tbar.login')}</a>`;
  }

  // ---------- Başlangıç ----------
  async function boot() {
    const params = new URLSearchParams(location.search);
    const joinCode = (params.get('k') || '').toUpperCase();
    const setId = params.get('id');
    let fromLink = null;
    if (location.hash.length > 1) { try { fromLink = dec(location.hash.slice(1)); } catch (e) {} }
    const safeWrite = c => { try { writeConfig(c); return !o.validate(readConfig()); } catch (e) { return false; } };

    if (remote) {
      session = (await sb.auth.getSession()).data.session;
      sb.auth.onAuthStateChange((_e, s) => { session = s; renderUser(); });
      renderUser();
      document.addEventListener('egido:lang', renderUser);
    }

    if (joinCode && remote) {
      isTeacher = false;
      $('#introQ').textContent = t('intro.loading'); $('#btnIntroStart').disabled = true; show('intro');
      try {
        const row = await joinByCode(joinCode);
        if (!row || !safeWrite(row.config)) { $('#introQ').textContent = t('intro.notFound'); $('#introErr').textContent = t('intro.notFoundHint'); return; }
        playSetId = row.id || null;
        applyCfgLang(row.config);
        gotoIntro(readConfig());
      } catch (e) { $('#introQ').textContent = t('intro.loadFail'); $('#introErr').textContent = t('intro.loadFailHint'); }
    } else if (setId && remote) {
      show('setup');
      if (!session) { setErr(t('tbar.openNeedLogin', { url: ROOT_URL })); return; }
      try { await loadSet(setId); if (params.get('share') === '1') share(); }
      catch (e) { setErr(t('tbar.notFound')); }
    } else if (fromLink && safeWrite(fromLink)) {
      isTeacher = false; applyCfgLang(fromLink); gotoIntro(readConfig());
    } else {
      show('setup');
    }
  }

  function init(options) { o = options; injectScreens(); wire(); boot(); }

  return {
    init, finish, show, toast, escapeHtml, shuffle, sfx, tone, audio, countdown, fmtTime, t,
    get player() { return player; }, get cfg() { return cfg; }, get remote() { return remote; }, get sb() { return sb; },
  };
})();
