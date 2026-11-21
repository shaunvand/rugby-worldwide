// Rugby Management Worldwide - scroll motion (Lenis + GSAP). Transforms and opacity only: no colour tweens.
// Content is fully visible without JS and under prefers-reduced-motion.
(() => {
  const { gsap, ScrollTrigger, Lenis } = window;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  if (reduced || !gsap || !ScrollTrigger) { root.classList.add('no-motion'); return; }
  root.classList.add('has-motion');
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---------------------------------------------------------- smooth scroll + progress bar
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const bar = document.createElement('div');
  bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute('href');
    const el = id.length > 1 && $(id);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: -(($('.hdr')?.offsetHeight || 72) + 8), duration: 1.3 });
  });
  const burger = $('.hdr__burger');
  burger?.addEventListener('click', () => setTimeout(() => {
    burger.getAttribute('aria-expanded') === 'true' ? lenis?.stop() : lenis?.start();
  }, 0));

  // ---------------------------------------------------------- headline word reveal
  const splitWords = el => {
    const out = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part; w.appendChild(i);
            frag.appendChild(w); out.push(i);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  };
  const h1 = $('main h1');
  const heroEl = $('.hero, .phero');
  if (h1 && heroEl && heroEl.contains(h1)) {
    const words = splitWords(h1);
    gsap.set(words, { yPercent: 115, rotate: 3 });
    gsap.to(words, { yPercent: 0, rotate: 0, duration: 1, ease: 'expo.out', stagger: 0.045, delay: 0.15 });
    const kids = $$('.kicker, .hero__lede, .phero__lede, .hero__btns, .hero__facts', heroEl);
    gsap.from(kids, { opacity: 0, y: 22, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.55 });
    const bg = $('.hero__bg, .phero__bg', heroEl);
    if (bg) {
      gsap.fromTo(bg, { scale: 1.22 }, { scale: 1.06, duration: 2.6, ease: 'power2.out' });
      gsap.to(bg, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    }
    gsap.to($('.hero__in, .phero__in', heroEl), { y: -60, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: heroEl, start: '55% top', end: 'bottom top', scrub: true } });
    // pitch lines draw themselves
    $$('.hero__pitch path, .hero__pitch circle').forEach((p, i) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1500;
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', delay: 0.4 + i * 0.18 });
    });
  }

  // ---------------------------------------------------------- counters
  $$('[data-count]').forEach(b => {
    const n = +b.dataset.count, o = { v: 0 };
    gsap.fromTo(o, { v: 0 }, { v: n, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 92%', once: true }, onUpdate: () => { b.textContent = Math.round(o.v); }, onComplete: () => { b.textContent = n; } });
    b.textContent = '0';
  });

  // ---------------------------------------------------------- marquee
  const track = $('.marquee__track');
  if (track) {
    [...track.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
    let dir = 1, boost = 0;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => { dir = self.direction || dir; boost = Math.min(Math.abs(self.getVelocity()) / 400, 6); } });
    gsap.ticker.add(() => { boost *= 0.94; tween.timeScale(dir * (1 + boost)); });
  }

  // ---------------------------------------------------------- section heading underline + generic reveals
  $$('.sec__head h2, .split__copy h2, .planner h2, .band h2').forEach(h => {
    ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => h.classList.add('is-drawn') });
  });
  const items = ['.svc', '.pkg', '.event', '.steps li', '.incl li', '.feats li', '.sched li', '.gallery li', '.who li', '.tier', '.prod__info > *', '.pgrid:not(.pgrid--store) .pcard', '.contact > *', '.tw__media figure', '.facts__in > div', '.faq details', '.partners li', '.campcard > *', '.cd__in > *'];
  const els = items.flatMap(sel => $$(sel)).filter((e, i, a) => a.indexOf(e) === i && !e.closest('[data-store]') && !e.closest('.hero, .phero'));
  gsap.set(els, { opacity: 0, y: 44 });
  ScrollTrigger.batch(els, {
    start: 'top 90%', once: true,
    onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'transform' }),
  });

  // ---------------------------------------------------------- image wipes and parallax
  $$('.split__media img').forEach(im => {
    gsap.fromTo(im.parentElement, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: im.parentElement, start: 'top 82%', once: true }, clearProps: 'clipPath' });
    if (!im.closest('.split__media--logo')) {
      gsap.fromTo(im, { scale: 1.2 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });
  $$('.pkg > img, .svc img').forEach(im => {
    gsap.fromTo(im, { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom 40%', scrub: true } });
  });
  $$('.gallery li').forEach((li, i) => {
    gsap.to(li, { y: i % 2 ? -26 : 26, ease: 'none', scrollTrigger: { trigger: li, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.band, .shead').forEach(b => {
    gsap.fromTo(b, { backgroundPositionX: '0%' }, { backgroundPositionX: '100%', ease: 'none', scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------------------------------------------------------- big numbers (countdown) pulse
  $$('.cd__in [data-cd-mins], .facts__cd [data-cd-days]').forEach(b => {
    gsap.fromTo(b, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2)', scrollTrigger: { trigger: b, start: 'top 92%', once: true } });
  });

  // ---------------------------------------------------------- journey: the ball runs the path as you scroll
  const journey = $('.journey');
  if (journey) {
    const trail = $('.journey__trail', journey), ball = $('.journey__ball', journey), marks = $('.journey__marks', journey);
    const steps = $$('.journey__steps li', journey), len = trail.getTotalLength();
    const NS = 'http://www.w3.org/2000/svg';
    const at = f => trail.getPointAtLength(len * f);
    const dots = steps.map((_, i) => {
      const f = i / (steps.length - 1), p = at(f), c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 11); marks.appendChild(c); return { c, f };
    });
    trail.style.strokeDasharray = len; trail.style.strokeDashoffset = len;
    const place = f => {
      const p = at(f), q = at(Math.min(1, f + 0.004)), r = at(Math.max(0, f - 0.004));
      const ang = Math.atan2(q.y - r.y, q.x - r.x) * 180 / Math.PI;
      ball.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang + f * 720})`);
      trail.style.strokeDashoffset = len * (1 - f);
      dots.forEach((d, i) => { const on = f >= d.f - 0.001; d.c.classList.toggle('on', on); steps[i].classList.toggle('is-on', on); });
    };
    place(0);
    ScrollTrigger.create({ trigger: journey, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: self => place(Math.min(1, self.progress * 1.18)) });
  }

  // ---------------------------------------------------------- magnetic buttons (fine pointers only)
  if (fine) {
    $$('.hero .btn, .phero .btn, .band .btn, .journey .btn').forEach(b => {
      const mx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3.out' }), my = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3.out' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.28); my((e.clientY - r.top - r.height / 2) * 0.4); });
      b.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  // refresh once everything is loaded (never per image: images have intrinsic sizes)
  addEventListener('load', () => ScrollTrigger.refresh());
})();
