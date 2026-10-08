// Egido yapay zekâ ile içerik üretimi (Google Gemini, öğretmenin kendi ücretsiz anahtarıyla).
// Kullanım (oyun sayfasında, readConfig/writeConfig tanımlandıktan sonra):
//   EgidoAI.attach({ kind: 'mcq', nw: () => 3, read: readConfig, write: writeConfig })
// kind: 'mcq'   soru + 1 doğru + nw yanlış         → cfg.items  [{ q, a, w[] }]
//       'cats'  kategoriler, her birinde mcq        → cfg.cats   [{ name, qs[] }]
//       'lists' tek yönerge + doğru/yanlış listeleri → cfg.q, cfg.correct[], cfg.wrong[]
//       'words' kelime + emoji resmi                → cfg.items  [{ word, img: 'emoji:…' }] (+ cfg.wlang)
//       'sents' cümleler                            → cfg.items  ['…']
// Anahtar: giriş yapmış öğretmende Supabase `teacher_settings` tablosunda (RLS: yalnızca sahibi okur),
// yerel modda bu tarayıcının localStorage'ında. Gemini doğrudan tarayıcıdan çağrılır, aracı sunucu yok.
// Anahtarsız yol: aynı istem kopyalanıp herhangi bir sohbet yapay zekâsına yapıştırılır, yanıt geri yapıştırılır.
window.EgidoAI = (() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, ty) => (window.EgidoUI ? EgidoUI.toast(m, ty) : alert(m));
  const API = 'https://generativelanguage.googleapis.com/v1beta';
  const LS_KEY = 'egido-gemini-key';
  const LANG_NAMES = { tr: 'Turkish', en: 'English', de: 'German', es: 'Spanish' };
  let o = null, keyCache = undefined, keyUser = null, busy = false;

  // ---------- Anahtar saklama ----------
  const session = () => (window.Egido && Egido.remote && Egido.session) || null;
  const lsGet = () => { try { return localStorage.getItem(LS_KEY) || ''; } catch (e) { return ''; } };
  const lsSet = v => { try { v ? localStorage.setItem(LS_KEY, v) : localStorage.removeItem(LS_KEY); } catch (e) {} };
  const noTable = e => e && (e.code === '42P01' || e.code === 'PGRST205' || /teacher_settings/.test(e.message || ''));
  async function loadKey() {
    const s = session(), uid = s ? s.user.id : '';
    if (keyCache !== undefined && keyUser === uid) return keyCache;
    keyUser = uid;
    if (s) {
      const { data, error } = await Egido.sb.from('teacher_settings').select('gemini_key').eq('owner', s.user.id).maybeSingle();
      if (!error) return (keyCache = (data && data.gemini_key) || lsGet());
    }
    return (keyCache = lsGet());
  }
  async function saveKey(k) {
    const s = session();
    keyCache = k || '';
    if (!s) { lsSet(k); return 'local'; }
    const q = k
      ? Egido.sb.from('teacher_settings').upsert({ owner: s.user.id, gemini_key: k, updated_at: new Date().toISOString() })
      : Egido.sb.from('teacher_settings').delete().eq('owner', s.user.id);
    const { error } = await q;
    if (error) { lsSet(k); if (noTable(error)) return 'notable'; throw error; }
    lsSet(''); // hesapta saklandıysa tarayıcıdaki kopyayı tutma
    return 'db';
  }

  // ---------- Gemini ----------
  let models = null;
  async function listModels(key) {
    const r = await fetch(API + '/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error((j.error && j.error.message) || r.status); e.status = r.status; e.reason = j.error && j.error.status; throw e; }
    const names = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''));
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const pick = re => names.filter(n => re.test(n)).sort((a, b) => ver(b) - ver(a));
    // Önce kararlı Flash, sonra Flash-Lite, en son önizleme Flash sürümleri (ücretsiz katman bunlarda açık)
    const list = [...pick(/^gemini-[\d.]+-flash$/), ...pick(/^gemini-[\d.]+-flash-lite$/), ...pick(/^gemini-[\d.]+-flash(-lite)?-preview(-[\d-]+)?$/)];
    return list.length ? list.slice(0, 4) : ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  }
  async function generate(key, prompt) {
    if (!models) models = await listModels(key);
    let last = null;
    for (const m of models) {
      const r = await fetch(`${API}/models/${encodeURIComponent(m)}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
        if (text) return text;
        last = new Error('empty'); continue;
      }
      last = new Error((j.error && j.error.message) || String(r.status)); last.status = r.status; last.reason = j.error && j.error.status;
      if (![404, 429, 500, 503].includes(r.status)) break; // anahtar/izin hatasında diğer modeli deneme
    }
    throw last || new Error('fail');
  }

  // ---------- İstem ----------
  function buildPrompt(topic, count) {
    const lang = LANG_NAMES[(window.I18N && I18N.lang) || 'tr'] || 'Turkish', nw = o.nw ? o.nw() : 3;
    const head = `You help a school teacher prepare content for an educational classroom game played on tablets.
Teacher's request: """${topic}"""
Rules:
- Age-appropriate for the grade in the request, factually correct, unambiguous, correctly spelled (check articles, capital letters, accents and special letters such as ä ö ü ß ç ğ ı ş ñ).
- Choose the language from the request: e.g. for "German colours for 3rd grade" ask in ${lang} and give the answers in German, or the reverse when it fits better. If unclear, use ${lang}.
- Keep every text short. No numbering, no emojis inside texts unless asked, no explanations.
- Reply with ONLY valid JSON (no markdown fences, no comments) exactly in this shape:
`;
    const ex = { q: 'question', a: 'correct answer', w: Array.from({ length: nw }, (_, i) => 'wrong ' + (i + 1)) };
    switch (o.kind) {
      case 'mcq': return head + JSON.stringify({ items: [ex] }) + `
- Exactly ${count} items. Each has exactly ${nw} wrong answers that are plausible but clearly wrong. All answers of an item are different. Question max 140 characters, answers max 40 characters.`;
      case 'cats': { const nc = Math.max(2, Math.min(6, Math.round(count / 3))), per = Math.max(2, Math.ceil(count / nc));
        return head + JSON.stringify({ cats: [{ name: 'category', qs: [ex] }] }) + `
- ${nc} categories with short names (max 22 characters), each with ${per} questions. Each question has exactly ${nw} wrong answers that are plausible but clearly wrong. All answers of a question are different. Question max 140 characters, answers max 40 characters.`; }
      case 'lists': return head + JSON.stringify({ q: 'short instruction for the students', correct: ['…'], wrong: ['…'] }) + `
- "q" tells students which items are correct (e.g. "Pop the balloons with fruits!"). ${count} items in "correct" and ${count} items in "wrong". Each item is 1–3 words, max 24 characters. No item appears in both lists.`;
      case 'words': return head + JSON.stringify({ lang: 'de', items: [{ word: 'Apfel', emoji: '🍎' }] }) + `
- Exactly ${count} items. "word" is a single word or very short phrase of 2–16 letters that students will spell, in the target language of the request. "emoji" is ONE emoji that clearly shows the word (it is the picture students see). "lang" is the ISO code of the words' language: one of en, de, es, tr.`;
      case 'sents': return head + JSON.stringify({ items: ['A short sentence.'] }) + `
- Exactly ${count} simple, natural sentences of 3–10 words with correct punctuation. Students will put the shuffled words back in order, so each sentence must have only one sensible word order.`;
    }
    return head;
  }

  // ---------- Yanıtı çözümle ----------
  const str = (v, n) => (typeof v === 'string' || typeof v === 'number') ? String(v).replace(/\s+/g, ' ').trim().slice(0, n) : '';
  const low = s => s.toLocaleLowerCase();
  function parseJson(text) {
    let s = String(text || '').replace(/```(?:json)?/gi, '');
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('nojson');
    return JSON.parse(s.slice(a, b + 1));
  }
  function mcqItem(x, nw) {
    if (!x || typeof x !== 'object') return null;
    const q = str(x.q || x.question, 200), a = str(x.a || x.answer || x.correct, 60);
    const w = (Array.isArray(x.w || x.wrong) ? (x.w || x.wrong) : []).map(v => str(v, 60)).filter(Boolean);
    const seen = new Set([low(a)]), ww = [];
    for (const v of w) if (!seen.has(low(v))) { seen.add(low(v)); ww.push(v); }
    if (!q || !a || ww.length < nw) return null;
    return { q, a, w: ww.slice(0, nw) };
  }
  function normalize(data) {
    const nw = o.nw ? o.nw() : 3;
    switch (o.kind) {
      case 'mcq': { const items = (data.items || data.questions || []).map(x => mcqItem(x, nw)).filter(Boolean); return items.length ? { items } : null; }
      case 'cats': {
        const cats = (data.cats || data.categories || []).map(c => ({ name: str(c && (c.name || c.category), 30), qs: ((c && (c.qs || c.questions)) || []).map(x => mcqItem(x, nw)).filter(Boolean) })).filter(c => c.name && c.qs.length);
        return cats.length ? { cats } : null;
      }
      case 'lists': {
        const c = (data.correct || []).map(v => str(v, 30)).filter(Boolean), cl = new Set(c.map(low));
        const w = (data.wrong || []).map(v => str(v, 30)).filter(v => v && !cl.has(low(v)));
        return c.length && w.length ? { q: str(data.q || data.question, 160), correct: [...new Set(c)], wrong: [...new Set(w)] } : null;
      }
      case 'words': {
        const items = (data.items || data.words || []).map(x => {
          const word = str(x && (x.word || x.text), 40).replace(/[^\p{L}\p{M} '\-]/gu, '').trim();
          const em = str(x && (x.emoji || x.icon), 16);
          const g = em && typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter().segment(em)][0].segment : em;
          const n = word.replace(/ /g, '').length;
          return n >= 2 && n <= 16 ? { word, img: g ? 'emoji:' + g : '' } : null;
        }).filter(Boolean);
        const lang = ['en', 'de', 'es', 'tr'].includes(data.lang) ? data.lang : '';
        return items.length ? { items, lang } : null;
      }
      case 'sents': {
        const items = (data.items || data.sentences || []).map(v => str(typeof v === 'object' && v ? v.text || v.sentence : v, 200)).filter(s => { const n = s.split(' ').length; return n >= 2 && n <= 14; });
        return items.length ? { items } : null;
      }
    }
    return null;
  }
  function apply(d) {
    const cfg = o.read();
    let n = 0, replaced = false;
    if (o.kind === 'lists') { cfg.q = d.q || cfg.q; cfg.correct = d.correct; cfg.wrong = d.wrong; replaced = true; }
    else if (o.kind === 'cats') { cfg.cats = [...(cfg.cats || []), ...d.cats]; n = d.cats.reduce((s, c) => s + c.qs.length, 0); }
    else {
      cfg.items = [...(cfg.items || []), ...d.items]; n = d.items.length;
      if (o.kind === 'words' && d.lang) { if ('wlang' in cfg) cfg.wlang = d.lang; else if ('lang' in cfg) cfg.lang = d.lang; } // Dinle ve Yaz: kelime dili 'wlang'
    }
    o.write(cfg);
    toast(replaced ? t('ai.replaced') : t('ai.added', { n }));
  }

  // ---------- Pencere ----------
  function errMsg(e) {
    if (e && (e.reason === 'RESOURCE_EXHAUSTED' || e.status === 429)) return t('ai.quota');
    if (e && (e.status === 400 || e.status === 401 || e.status === 403) && /api key|API_KEY|permission|unauth/i.test((e.message || '') + (e.reason || ''))) return t('ai.keyBad');
    if (e && (e instanceof SyntaxError || e.message === 'nojson' || e.message === 'empty')) return t('ai.parseFail');
    return t('ai.fail', { e: (e && e.message) || e });
  }
  function close() { const el = $('#aiOverlay'); if (el) el.remove(); }
  async function open() {
    close();
    const el = document.createElement('div'); el.className = 'dlg-overlay'; el.id = 'aiOverlay';
    el.innerHTML = `<div class="card dlg ai-dlg" role="dialog" aria-modal="true">
      <div class="ai-head"><h2>${t('ai.title')}</h2><button class="ai-x" id="aiClose" aria-label="close">✕</button></div>
      <label for="aiTopic">${t('ai.topic')}</label>
      <textarea id="aiTopic" rows="2" maxlength="400" placeholder="${esc(t('ai.topicPh'))}"></textarea>
      <div class="ai-row">
        <label for="aiCount">${t('ai.count')}</label>
        <select id="aiCount">${[5, 8, 10, 15, 20].map(n => `<option value="${n}"${n === 8 ? ' selected' : ''}>${n}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn" id="aiGen">${t('ai.gen')}</button>
      </div>
      <div class="ai-status" id="aiStatus"></div>
      <div class="ai-key" id="aiKey"></div>
      <details class="ai-manual" id="aiManual">
        <summary>${t('ai.manual')}</summary>
        <p class="hint">${t('ai.manualHelp')}</p>
        <div class="row"><button class="btn secondary small" id="aiCopy">${t('ai.copy')}</button></div>
        <textarea id="aiPaste" rows="4" placeholder="${esc(t('ai.pastePh'))}"></textarea>
        <div class="row"><button class="btn secondary" id="aiApply">${t('ai.apply')}</button></div>
      </details>
      <p class="hint ai-warn">⚠️ ${t('ai.check')}</p>
    </div>`;
    document.body.appendChild(el);
    const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    $('#aiClose').onclick = close;
    el.addEventListener('mousedown', e => { if (e.target === el) close(); });
    try { $('#aiTopic').value = sessionStorage.getItem('egido-ai-topic') || ''; } catch (e) {}
    $('#aiTopic').oninput = () => { try { sessionStorage.setItem('egido-ai-topic', $('#aiTopic').value); } catch (e) {} };
    $('#aiTopic').focus();

    const topic = () => { const v = $('#aiTopic').value.trim(); if (!v) { status(t('ai.topicNeed'), true); $('#aiTopic').focus(); } return v; };
    const status = (m, bad) => { const s = $('#aiStatus'); s.innerHTML = m || ''; s.classList.toggle('bad', !!bad); };

    $('#aiGen').onclick = async () => {
      if (busy) return;
      const tp = topic(); if (!tp) return;
      const key = await loadKey();
      if (!key) { status(t('ai.keyNeed'), true); renderKey(true); return; }
      busy = true; $('#aiGen').disabled = true; status(`<span class="ai-spin"></span>${t('ai.generating')}`);
      try {
        const d = normalize(parseJson(await generate(key, buildPrompt(tp, +$('#aiCount').value))));
        if (!d) throw new Error('nojson');
        apply(d); close();
      } catch (e) { status(esc(errMsg(e)), true); if (/api key|API_KEY/i.test(e && e.message || '')) renderKey(true); }
      finally { busy = false; const b = $('#aiGen'); if (b) b.disabled = false; }
    };
    $('#aiCopy').onclick = async () => {
      const tp = topic(); if (!tp) return;
      const p = buildPrompt(tp, +$('#aiCount').value);
      try { await navigator.clipboard.writeText(p); toast(t('ai.copied')); }
      catch (e) { $('#aiPaste').value = p; $('#aiPaste').select(); toast(t('share.copyManual'), 'error'); }
    };
    $('#aiApply').onclick = () => {
      try { const d = normalize(parseJson($('#aiPaste').value)); if (!d) throw new Error('nojson'); apply(d); close(); }
      catch (e) { status(esc(t('ai.parseFail')), true); }
    };
    renderKey(false);
  }
  async function renderKey(forceEdit) {
    const box = $('#aiKey'); if (!box) return;
    const key = await loadKey().catch(() => '');
    if (key && !forceEdit) {
      box.innerHTML = `<div class="ai-keyok">🔑 ${t('ai.keySaved')} <code>${esc(key.slice(0, 6))}…${esc(key.slice(-4))}</code>
        <span class="spacer"></span><button class="btn secondary small" id="aiKeyEdit">${t('ai.keyChange')}</button><button class="btn secondary small" id="aiKeyDel">${t('ai.keyDel')}</button></div>`;
      $('#aiKeyEdit').onclick = () => renderKey(true);
      $('#aiKeyDel').onclick = async () => { try { await saveKey(''); models = null; renderKey(true); } catch (e) { toast(errMsg(e), 'error'); } };
      return;
    }
    box.innerHTML = `<label for="aiKeyIn">${t('ai.keyTitle')}</label>
      <p class="hint">${t('ai.keyHelp')} ${session() ? t('ai.keyDb') : t('ai.keyLocal')}</p>
      <div class="ai-row"><input type="password" id="aiKeyIn" autocomplete="off" spellcheck="false" placeholder="AIza…"><button class="btn secondary" id="aiKeySave">${t('ai.keySave')}</button></div>`;
    $('#aiKeySave').onclick = async () => {
      const k = $('#aiKeyIn').value.trim(); if (!k) return;
      const b = $('#aiKeySave'); b.disabled = true;
      try {
        models = await listModels(k); // anahtarı doğrula + kullanılabilir modelleri öğren
        const where = await saveKey(k);
        toast(where === 'notable' ? t('ai.noTable') : t('ai.keyOk'), where === 'notable' ? 'error' : undefined);
        renderKey(false);
      } catch (e) { const s = $('#aiStatus'); if (s) { s.textContent = errMsg(e); s.classList.add('bad'); } }
      finally { b.disabled = false; }
    };
  }

  function attach(opts) {
    o = opts;
    const ex = $('#btnExample'); if (!ex || $('#btnAI')) return;
    const b = document.createElement('button');
    b.className = 'btn small ai-btn'; b.id = 'btnAI'; b.type = 'button'; b.setAttribute('data-i18n', 'ai.btn'); b.textContent = t('ai.btn');
    b.onclick = open;
    ex.insertAdjacentElement('afterend', b);
    if (window.I18N) I18N.apply();
  }
  return { attach, open, buildPrompt: (tp, n) => buildPrompt(tp, n), normalize: d => normalize(d), parseJson };
})();
