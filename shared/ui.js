// Egido küçük arayüz yardımcıları: toast bildirimi ve onay penceresi (tarayıcı alert/confirm yerine).
//   EgidoUI.toast('mesaj')            bilgi      EgidoUI.toast('mesaj', 'error')  hata (kırmızı)
//   await EgidoUI.confirm('Soru?')    → true/false  (seçenek: { ok, cancel, danger })
window.EgidoUI = (() => {
  'use strict';
  const t = (k, v) => (window.I18N ? I18N.t(k, v) : k);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastEl = null, toastT = null;
  function toast(msg, type) {
    if (!toastEl) { toastEl = document.getElementById('toast') || document.createElement('div'); toastEl.id = 'toast'; toastEl.className = 'toast'; if (!toastEl.parentNode) document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.toggle('error', type === 'error'); toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), type === 'error' ? 4200 : 2600);
  }

  function confirm(msg, opts = {}) {
    return new Promise(resolve => {
      const el = document.createElement('div'); el.className = 'dlg-overlay';
      el.innerHTML = `<div class="card dlg" role="dialog" aria-modal="true">
        <div class="dlg-msg">${esc(msg).replace(/\n/g, '<br>')}</div>
        <div class="row" style="justify-content:flex-end;margin-top:18px">
          <button class="btn secondary" data-r="0">${esc(opts.cancel || t('dlg.cancel'))}</button>
          <button class="btn ${opts.danger ? 'logout' : ''}" data-r="1">${esc(opts.ok || t('dlg.ok'))}</button>
        </div></div>`;
      const done = r => { el.remove(); document.removeEventListener('keydown', onKey); resolve(r); };
      const onKey = e => { if (e.key === 'Escape') done(false); if (e.key === 'Enter') done(true); };
      el.querySelectorAll('button').forEach(b => b.onclick = () => done(b.dataset.r === '1'));
      el.addEventListener('click', e => { if (e.target === el) done(false); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(el);
      el.querySelector('[data-r="1"]').focus();
    });
  }
  return { toast, confirm };
})();
