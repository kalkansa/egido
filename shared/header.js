// Egido üst başlık: giriş yapmış öğretmen için tüm sayfalarda ortak menü.
// Kullanım: EgidoHeader.render({ session, sb, root, active: 'home'|'game' })  →  giriş yoksa başlığı kaldırır.
// Oyun kataloğu da burada tek yerde tutulur; ana sayfa ve "Yeni Oyun" menüsü bunu kullanır.
window.EgidoHeader = (() => {
  'use strict';
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GAMES = [{ id: 'balon', emoji: '🎈' }, { id: 'gol', emoji: '⚽' }, { id: 'puzzle', emoji: '🧩' }, { id: 'kablo', emoji: '🔌' }, { id: 'cumle', emoji: '📝' }, { id: 'dinle', emoji: '🔊' }, { id: 'penguen', emoji: '🐧' }, { id: 'cark', emoji: '🎡' }, { id: 'kule', emoji: '🗼' }, { id: 'canli', emoji: '📺' }];
  const gname = id => { const k = 'game.' + id + '.name'; const n = t(k); return n === k ? id : n; };
  let state = null;

  function render(opts) {
    state = opts;
    let el = document.getElementById('topbar');
    if (!opts.session) { if (el) el.remove(); document.body.classList.remove('has-topbar'); return; }
    if (!el) { el = document.createElement('header'); el.id = 'topbar'; el.className = 'topbar'; document.body.prepend(el); }
    const user = esc(opts.session.user.email.replace('@' + ((window.BP_CONFIG || {}).userDomain || 'egido.local'), ''));
    const lang = window.I18N ? I18N.selectorHtml() : '';
    el.innerHTML = `
      <a class="brand" href="${opts.root}"><img src="${opts.root}shared/logo.svg?v=202610051135" alt="">Kara Tahta</a>
      <nav class="topnav">
        <a href="${opts.root}" class="${opts.active === 'home' ? 'active' : ''}">🗂 ${t('home.myGames')}</a>
        <div class="menu">
          <button type="button" class="menu-btn ${opts.active === 'game' ? 'active' : ''}">➕ ${t('nav.new')} ▾</button>
          <div class="menu-list">${GAMES.map(g => `<a href="${opts.root}games/${g.id}/">${g.emoji} ${esc(gname(g.id))}</a>`).join('')}</div>
        </div>
      </nav>
      <div class="spacer"></div>
      ${lang}
      <div class="usermenu">
        <button type="button" class="user-btn">👤 <span>${user}</span> ▾</button>
        <div class="user-list">
          <button type="button" id="topChangePw">${t('user.changePw')}</button>
          <button type="button" id="topLogout" class="danger">⏻ ${t('tbar.logout')}</button>
        </div>
      </div>`;
    document.body.classList.add('has-topbar');
    const menu = el.querySelector('.menu');
    el.querySelector('.menu-btn').onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
    document.addEventListener('click', () => menu.classList.remove('open'));
    const um = el.querySelector('.usermenu');
    el.querySelector('.user-btn').onclick = e => { e.stopPropagation(); menu.classList.remove('open'); um.classList.toggle('open'); };
    document.addEventListener('click', () => um.classList.remove('open'));
    el.querySelector('#topLogout').onclick = async () => { await opts.sb.auth.signOut(); location.href = opts.root; };
    el.querySelector('#topChangePw').onclick = () => { um.classList.remove('open'); changePassword(opts); };
    if (window.I18N) { I18N.apply(el); I18N.bindSelectors(el); }
  }
  document.addEventListener('egido:lang', () => { if (state) render(state); });
  // Şifre değiştir: eski şifre yeniden giriş yapılarak doğrulanır, sonra yeni şifre kaydedilir
  function changePassword(opts) {
    const el = document.createElement('div'); el.className = 'dlg-overlay';
    el.innerHTML = `<div class="card dlg" role="dialog" aria-modal="true">
      <h2 style="margin:0 0 12px;font-size:22px">${t('pw.title')}</h2>
      <form id="pwForm" autocomplete="off">
        <label for="pwOld">${t('pw.old')}</label><input type="password" id="pwOld" autocomplete="current-password">
        <label for="pwNew">${t('pw.new')}</label><input type="password" id="pwNew" autocomplete="new-password">
        <label for="pwRep">${t('pw.repeat')}</label><input type="password" id="pwRep" autocomplete="new-password">
        <div class="err" id="pwErr"></div>
        <div class="row" style="justify-content:flex-end">
          <button type="button" class="btn secondary" id="pwCancel">${t('dlg.cancel')}</button>
          <button type="submit" class="btn" id="pwSave">${t('pw.save')}</button>
        </div>
      </form></div>`;
    const close = () => el.remove();
    el.querySelector('#pwCancel').onclick = close;
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.querySelector('#pwForm').onsubmit = async e => {
      e.preventDefault();
      const err = el.querySelector('#pwErr'), btn = el.querySelector('#pwSave');
      const oldPw = el.querySelector('#pwOld').value, nw = el.querySelector('#pwNew').value, rep = el.querySelector('#pwRep').value;
      if (nw.length < 6) { err.textContent = t('pw.min'); return; }
      if (nw !== rep) { err.textContent = t('pw.mismatch'); return; }
      err.textContent = ''; btn.disabled = true; const label = btn.textContent; btn.textContent = t('pw.saving');
      try {
        const { error: e1 } = await opts.sb.auth.signInWithPassword({ email: opts.session.user.email, password: oldPw });
        if (e1) { err.textContent = t('pw.wrongOld'); return; }
        const { error: e2 } = await opts.sb.auth.updateUser({ password: nw });
        if (e2) { err.textContent = t('pw.fail', { e: e2.message }); return; }
        close(); if (window.EgidoUI) EgidoUI.toast(t('pw.ok'));
      } finally { btn.disabled = false; btn.textContent = label; }
    };
    document.body.appendChild(el);
    el.querySelector('#pwOld').focus();
  }
  function setVisible(v) { const el = document.getElementById('topbar'); if (el) el.classList.toggle('hidden', !v); document.body.classList.toggle('has-topbar', !!el && v); }

  return { render, setVisible, GAMES, gname };
})();
