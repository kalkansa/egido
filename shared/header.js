// Egido üst başlık: giriş yapmış öğretmen için tüm sayfalarda ortak menü.
// Kullanım: EgidoHeader.render({ session, sb, root, active: 'home'|'game' })  →  giriş yoksa başlığı kaldırır.
// Oyun kataloğu da burada tek yerde tutulur; ana sayfa ve "Yeni Oyun" menüsü bunu kullanır.
window.EgidoHeader = (() => {
  'use strict';
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const GAMES = [{ id: 'balon', emoji: '🎈' }, { id: 'gol', emoji: '⚽' }, { id: 'puzzle', emoji: '🧩' }, { id: 'kablo', emoji: '🔌' }];
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
      <a class="brand" href="${opts.root}"><img src="${opts.root}shared/logo.svg" alt="">Egido</a>
      <nav class="topnav">
        <a href="${opts.root}" class="${opts.active === 'home' ? 'active' : ''}">🗂 ${t('home.myGames')}</a>
        <div class="menu">
          <button type="button" class="menu-btn ${opts.active === 'game' ? 'active' : ''}">➕ ${t('nav.new')} ▾</button>
          <div class="menu-list">${GAMES.map(g => `<a href="${opts.root}games/${g.id}/">${g.emoji} ${esc(gname(g.id))}</a>`).join('')}</div>
        </div>
      </nav>
      <div class="spacer"></div>
      ${lang}
      <span class="user">👤 ${user}</span>
      <button type="button" class="btn small logout" id="topLogout">⏻ ${t('tbar.logout')}</button>`;
    document.body.classList.add('has-topbar');
    const menu = el.querySelector('.menu');
    el.querySelector('.menu-btn').onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
    document.addEventListener('click', () => menu.classList.remove('open'));
    el.querySelector('#topLogout').onclick = async () => { await opts.sb.auth.signOut(); location.href = opts.root; };
    if (window.I18N) { I18N.apply(el); I18N.bindSelectors(el); }
  }
  document.addEventListener('egido:lang', () => { if (state) render(state); });
  function setVisible(v) { const el = document.getElementById('topbar'); if (el) el.classList.toggle('hidden', !v); document.body.classList.toggle('has-topbar', !!el && v); }

  return { render, setVisible, GAMES, gname };
})();
