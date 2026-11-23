// Rugby Management Worldwide - small, dependency-free page helpers.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '27765839987';
  const EMAIL = 'info@rugbyworldwide.co.za';

  // mobile menu
  const burger = $('.hdr__burger'), nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('is-open')) burger.click(); });

  // countdowns
  $$('[data-countdown]').forEach(el => {
    const t = new Date(el.dataset.countdown).getTime();
    const tick = () => {
      const ms = Math.max(0, t - Date.now());
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
      const set = (k, v) => { const n = $(`[data-cd-${k}]`, el); if (n) n.textContent = v; };
      set('days', d.toLocaleString('en-ZA')); set('hours', h); set('mins', m);
    };
    tick(); setInterval(tick, 30000);
  });

  // enquiry forms -> email via the site's mailer (rugbyworldwide.co.za), else prefilled WhatsApp / email app
  const LIVE = /(^|\.)rugbyworldwide\.co\.za$/.test(location.hostname);
  $$('form[data-enquiry]').forEach(form => {
    let via = 'wa';
    const hp = document.createElement('input');
    hp.type = 'text'; hp.name = 'rmww_hpx'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(hp);
    $$('button[data-via]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = $('.form__msg', form);
      let bad = null;
      $$('[required]', form).forEach(f => {
        const ok = f.type === 'radio' ? !!form.querySelector(`[name="${f.name}"]:checked`) : f.value.trim() && f.checkValidity();
        f.classList.toggle('is-bad', !ok);
        if (!ok && !bad) bad = f;
      });
      if (bad) { msg.textContent = 'Please complete the highlighted fields.'; msg.classList.add('is-err'); bad.focus(); return; }
      msg.classList.remove('is-err');
      const data = new FormData(form), rows = {};
      for (const [k, v] of data) { if (k !== 'rmww_hpx' && String(v).trim()) rows[k] = rows[k] ? rows[k] + ', ' + v : v; }
      const title = form.dataset.enquiry === 'tour' ? 'Rugby tour enquiry' : form.dataset.enquiry;
      const text = `${title}\n\n` + Object.entries(rows).map(([k, v]) => `${k}: ${v}`).join('\n');
      if (via === 'email' && LIVE) {
        const btns = $$('button[type=submit]', form);
        btns.forEach(b => { b.disabled = true; });
        msg.textContent = 'Sending...';
        try {
          const r = await fetch('/wp-json/rmww/v1/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ form: title, fields: rows, page: location.href, hp: hp.value }) });
          if (!r.ok) throw new Error(r.status);
          msg.textContent = `Thank you. Your enquiry was sent to ${EMAIL} and we will reply soon.`;
          form.reset();
          return;
        } catch (err) {
          msg.textContent = '';
        } finally { btns.forEach(b => { b.disabled = false; }); }
      }
      if (via === 'email') location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(title + ' (website)')}&body=${encodeURIComponent(text)}`;
      else window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      msg.textContent = via === 'email' ? 'Your email app has opened with the details filled in.' : 'WhatsApp has opened with your message ready to send.';
    });
  });

  // store: search, category filter, sort (works without JS: all products are listed)
  const grid = $('[data-store]');
  if (grid) {
    const cards = $$('.pcard', grid), q = $('[data-store-q]'), sort = $('[data-store-sort]'), n = $('[data-store-n]'), empty = $('.store__empty');
    const chips = $$('.fchip');
    cards.forEach((c, i) => { c.dataset.i = i; });
    let cat = 'all';
    const apply = () => {
      const term = (q.value || '').trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const ok = (cat === 'all' || c.dataset.cat.split(' ').includes(cat)) && (!term || c.dataset.name.includes(term) || c.dataset.cat.includes(term));
        c.hidden = !ok; if (ok) shown++;
      });
      n.textContent = shown; empty.hidden = shown > 0;
      const by = { feat: (a, b) => a.dataset.i - b.dataset.i, lo: (a, b) => a.dataset.price - b.dataset.price, hi: (a, b) => b.dataset.price - a.dataset.price, az: (a, b) => a.dataset.name.localeCompare(b.dataset.name) }[sort.value];
      cards.slice().sort(by).forEach(c => grid.appendChild(c));
    };
    const pick = c => { cat = c; chips.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === c))); apply(); };
    chips.forEach(b => b.addEventListener('click', () => { pick(b.dataset.f); history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : '#' + b.dataset.f); }));
    q.addEventListener('input', apply); sort.addEventListener('change', apply);
    const h = location.hash.slice(1);
    if (h && chips.some(b => b.dataset.f === h)) pick(h);
  }

  // product gallery
  const main = $('[data-main]');
  $$('.prod__thumbs button').forEach(b => b.addEventListener('click', () => {
    main.src = b.dataset.src;
    $$('.prod__thumbs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));

  // ambassador points calculator
  const calc = $('[data-calc]');
  if (calc) {
    const tiers = JSON.parse(calc.dataset.calc);
    const out = $('[data-calc-total]'), tierOut = $('[data-calc-tier]');
    const run = () => {
      const total = $$('input[data-ref]', calc).reduce((s, i) => s + Math.max(0, +i.value || 0) * +i.dataset.ref, 0);
      out.textContent = total.toLocaleString('en-ZA');
      const reach = tiers.filter(([, pts]) => pts > 0 && total >= pts).pop();
      const next = tiers.find(([, pts]) => pts > total);
      tierOut.textContent = total === 0 ? 'Refer members to start earning.'
        : (reach ? `Enough points for the ${reach[0]} level (${reach[1].toLocaleString('en-ZA')} points).` : 'Keep going.') + (next ? ` ${(next[1] - total).toLocaleString('en-ZA')} more to reach ${next[0]}.` : '');
    };
    calc.addEventListener('input', run); run();
  }
})();
