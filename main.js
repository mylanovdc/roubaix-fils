// Roubaix & Fils — motion, vanilla JS, geen libraries
// Performance: elke lus stopt zodra er niets beweegt of het element buiten beeld is.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sr = (t) => `<span class="sr">${t}</span>`; // verborgen kopie voor schermlezers

/* ---------- Tekst splitsen ---------- */
// Titels: woorden in een masker
document.querySelectorAll('.split').forEach((el) => {
  const text = el.textContent.trim();
  el.innerHTML = sr(text) + text.split(/\s+/)
    .map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');
});
document.querySelectorAll('.hero__title, .reveal-words').forEach((t) =>
  t.querySelectorAll('.wi').forEach((w, i) => w.style.setProperty('--wi', i)));

// Sfeerblok: letters, per woord gegroepeerd zodat een woord nooit breekt
const letterEls = [...document.querySelectorAll('.letters')];
const lettersTotal = letterEls.reduce((n, el) => n + el.textContent.replace(/\s/g, '').length, 0);
let li = 0;
letterEls.forEach((el) => {
  const text = el.textContent;
  el.innerHTML = sr(text) + text.split(' ').map((word) => `<span class="word" aria-hidden="true">${
    [...word].map((c) => `<span class="l" style="--k:${(li++ / lettersTotal).toFixed(3)}">${c}</span>`).join('')}</span>`).join(' ');
});

// Quote: woorden (ook binnen <em>) krijgen een scroll-index
document.querySelectorAll('.scrub').forEach((el) => {
  const plain = el.textContent;
  const wrap = (t) => t.trim().split(/\s+/).map((w) => `<span class="sw" aria-hidden="true">${w}</span>`).join(' ');
  el.innerHTML = [...el.childNodes].map((n) => n.nodeType === 3
    ? (n.textContent.trim() ? (/^\s/.test(n.textContent) ? ' ' : '') + wrap(n.textContent) + (/\s$/.test(n.textContent) ? ' ' : '') : n.textContent)
    : `<${n.localName}>${wrap(n.textContent)}</${n.localName}>`).join('') + sr(plain);
  const sws = el.querySelectorAll('.sw');
  sws.forEach((s, i) => s.style.setProperty('--k', (i / sws.length).toFixed(3)));
});

/* ---------- Video (sfeerblok): speelt enkel in beeld, altijd te pauzeren ---------- */
const nav = document.getElementById('nav');
const video = document.getElementById('moodVideo');
const toggle = document.getElementById('videoToggle');
const label = toggle.querySelector('.sr');
let userPaused = reduce; // bij minder beweging: niet vanzelf starten
const sync = () => {
  toggle.setAttribute('aria-pressed', String(video.paused));
  label.textContent = video.paused ? 'Speel video af' : 'Pauzeer video';
};
toggle.addEventListener('click', () => {
  if (video.paused) { userPaused = false; video.play().catch(sync); } else { userPaused = true; video.pause(); }
});
video.addEventListener('play', sync);
video.addEventListener('pause', sync);
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !userPaused) { video.preload = 'auto'; video.play().catch(sync); }
  else if (!e.isIntersecting && !video.paused) video.pause();
}, { threshold: 0.35 }).observe(video);
sync();

/* ---------- Intro → hero ---------- */
const startHero = () => root.classList.add('hero-in');
const intro = document.getElementById('intro');
if (root.classList.contains('intro-on')) {
  try { sessionStorage.setItem('rf-intro', '1'); } catch (e) {}
  let done = false;
  const end = () => {
    if (done) return; done = true;
    root.classList.add('intro-out');
    setTimeout(startHero, 250);
    setTimeout(() => root.classList.remove('intro-on', 'intro-out'), 1300);
  };
  setTimeout(end, 2300);
  intro.addEventListener('click', end);
  addEventListener('keydown', end, { once: true });
} else {
  requestAnimationFrame(startHero);
}

/* ---------- Eenmalige reveals ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.reveal, .reveal-words').forEach((el) => io.observe(el));

/* ---------- #privacy opent de privacyverklaring ---------- */
const privacy = document.getElementById('privacy');
const openPrivacy = () => { if (location.hash === '#privacy') privacy.open = true; };
addEventListener('hashchange', openPrivacy);
openPrivacy();

/* ---------- Sfeerblok-choreografie (p = voortgang van het vastgepinde blok, 0→1) ---------- */
const mood = document.querySelector('.mood');
const moodStick = document.getElementById('moodStick');
const moodMedia = document.getElementById('moodMedia');
const moodClock = document.getElementById('moodClock');
let lastClock = '';
function moodLayout(p) {
  const W = moodStick.clientWidth, H = moodStick.clientHeight, w = H * 9 / 16;
  const mobile = W < 760;
  // video staat vast op haar plek (desktop: rechts, gsm: boven); enkel tekst + klok volgen de scroll
  const c = clamp((p - 0.08) / 0.72);
  const s = mobile ? 0.62 : 1;
  const tx = mobile ? W / 2 - w / 2 : W - w;
  const ty = mobile ? -H / 2 + (H * s) / 2 + 64 : 0;
  moodMedia.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s})`;
  mood.style.setProperty('--c', c.toFixed(3));
  // klok: 23:57:00 → 00:00:00 (180 seconden)
  const sec = Math.round(c * 180), t = 23 * 3600 + 57 * 60 + sec;
  const hh = Math.floor(t / 3600) % 24, mm = Math.floor(t / 60) % 60, ss = t % 60;
  const txt = [hh, mm, ss].map((n) => String(n).padStart(2, '0')).join(':');
  if (txt !== lastClock) { lastClock = txt; moodClock.textContent = txt; mood.classList.toggle('is-midnight', sec >= 180); }
}

if (reduce) {
  document.querySelectorAll('[data-scroll]').forEach((el) => el.style.setProperty('--p', 1));
  moodLayout(1);
  addEventListener('resize', () => moodLayout(1));
  const solid = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();
} else {
  motion();
}

function motion() {
  const hero = document.querySelector('.hero');

  /* ---------- Scroll-engine: --p (0→1) per zichtbare sectie, enkel bij verandering ---------- */
  const scrollers = [...document.querySelectorAll('[data-scroll]')].map((el) => ({ el, last: -1, pinned: el.classList.contains('mood') }));
  const visible = new Set();
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const s = scrollers.find((x) => x.el === e.target);
    e.isIntersecting ? visible.add(s) : visible.delete(s);
    onScroll();
  }), { rootMargin: '25% 0px' });
  scrollers.forEach((s) => vio.observe(s.el));

  let ticking = false, lastSy = -1;
  const frame = () => {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    for (const s of visible) {
      const r = s.el.getBoundingClientRect();
      const p = s.pinned ? clamp(-r.top / (r.height - vh)) : clamp((vh - r.top) / (vh + r.height));
      if (Math.abs(p - s.last) > 0.0015 || forceLayout) {
        s.last = p; s.el.style.setProperty('--p', p.toFixed(4));
        if (s.pinned) moodLayout(p);
      }
    }
    forceLayout = false;
    const sy = Math.round(Math.min(y, vh * 1.2));
    if (sy !== lastSy) { lastSy = sy; hero.style.setProperty('--sy', sy); }
  };
  let forceLayout = true;
  addEventListener('resize', () => { forceLayout = true; });
  moodLayout(0);
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  requestAnimationFrame(frame);

  /* ---------- Band: snelheid + richting volgen het scrollen; draait enkel in beeld ---------- */
  const track = document.getElementById('bandTrack');
  root.classList.add('band-js');
  let bandOn = false, bandRaf = 0, lastY = scrollY, vel = 0, bandX = 0, dir = 1, half = track.scrollWidth / 2;
  addEventListener('resize', () => { half = track.scrollWidth / 2; });
  const bandLoop = () => {
    const y = scrollY, d = y - lastY; lastY = y;
    if (d !== 0) dir = d > 0 ? 1 : -1;
    vel += (d - vel) * 0.12;
    bandX -= (0.5 + Math.abs(vel) * 0.35) * dir;
    if (bandX <= -half) bandX += half; else if (bandX > 0) bandX -= half;
    track.style.transform = `translate3d(${bandX.toFixed(1)}px,0,0) skewX(${clamp(-vel * 0.25, -12, 12).toFixed(2)}deg)`;
    bandRaf = bandOn && !document.hidden ? requestAnimationFrame(bandLoop) : 0;
  };
  const startBand = () => { if (bandOn && !bandRaf && !document.hidden) { lastY = scrollY; bandRaf = requestAnimationFrame(bandLoop); } };
  new IntersectionObserver(([e]) => { bandOn = e.isIntersecting; startBand(); }).observe(track.parentElement);
  document.addEventListener('visibilitychange', startBand);

  if (!finePointer) return;

  /* ---------- Hero volgt de muis (gedempt), stopt zodra in rust ---------- */
  let mx = 0, my = 0, cx = 0, cy = 0, followRaf = 0, heroOn = true;
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
  const follow = () => {
    cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
    hero.style.setProperty('--mx', cx.toFixed(4)); hero.style.setProperty('--my', cy.toFixed(4));
    followRaf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.001 ? requestAnimationFrame(follow) : 0;
  };
  addEventListener('pointermove', (e) => {
    if (!heroOn) return;
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    if (!followRaf) followRaf = requestAnimationFrame(follow);
  }, { passive: true });

  /* ---------- Kaarten: 3D-kanteling + spotlight ---------- */
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- Magnetische knoppen ---------- */
  document.querySelectorAll('[data-magnet]').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px');
      b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
  });

  /* ---------- Rookspoor achter de cursor (stopt als alle rook weg is) ---------- */
  const cv = document.getElementById('smoke');
  const ctx = cv.getContext('2d');
  const parts = [];
  let running = false, px = null, py = null;
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
  size(); addEventListener('resize', size);
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 96;
  const sg = sprite.getContext('2d'), grd = sg.createRadialGradient(48, 48, 0, 48, 48, 48);
  grd.addColorStop(0, 'rgba(188,133,169,.5)'); grd.addColorStop(.5, 'rgba(168,107,148,.16)'); grd.addColorStop(1, 'rgba(168,107,148,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 96, 96);

  addEventListener('pointermove', (e) => {
    if (px !== null) {
      const n = Math.min(2, Math.floor(Math.hypot(e.clientX - px, e.clientY - py) / 18));
      for (let i = 0; i < n && parts.length < 90; i++) {
        const t = i / n;
        parts.push({ x: px + (e.clientX - px) * t, y: py + (e.clientY - py) * t,
          vx: (Math.random() - 0.5) * 0.4, vy: -0.25 - Math.random() * 0.5,
          r: 10 + Math.random() * 12, life: 0, max: 60 + Math.random() * 40 });
      }
    }
    px = e.clientX; py = e.clientY;
    if (!running && parts.length) { running = true; requestAnimationFrame(draw); }
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.985; p.r += 0.5;
      const t = p.life / p.max;
      if (t >= 1) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = (1 - t) * (t < 0.15 ? t / 0.15 : 1) * 0.75;
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    if (parts.length) requestAnimationFrame(draw); else running = false;
  }
}
