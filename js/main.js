/* ──────── HEADER SCROLL ──────── */
const header = document.querySelector('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ──────── MOBILE NAV ──────── */
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  mobileNav.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    })
  );
}

/* ──────── ACTIVE NAV ──────── */
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
  const href = link.getAttribute('href') || '';
  const linkPage = href.split('/').pop();
  if (linkPage === page || (page === '' && linkPage === 'index.html')) {
    link.classList.add('active');
  }
});

/* ──────── SCROLL FADE-IN ──────── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ──────── SWARM CANVAS ──────── */
const canvas = document.getElementById('swarm-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const beeLogo = document.querySelector('.hero-logo');

  const isMobile = () => window.innerWidth < 768 || ('ontouchstart' in window);

  let W, H, particles = [];
  let COUNT     = isMobile() ? 35 : 90;
  let LINE_DIST = isMobile() ? 80 : 130;
  const YELLOW  = '255,215,0';
  let mouse = { x: -9999, y: -9999 };

  /* Faza zbierania się wokół pszczółki */
  const GATHER_DELAY    = 1500;  /* ms – swobodny lot przed zbieraniem */
  const GATHER_DURATION = 4500;  /* ms – czas przejścia */
  let startTs = null;

  function getBeeRect() {
    if (!beeLogo) return { x: W / 2, y: H / 2, r: 80 };
    const rect = beeLogo.getBoundingClientRect();
    return {
      x: rect.left + rect.width  / 2,
      y: rect.top  + rect.height / 2,
      r: Math.max(rect.width, rect.height) / 2,
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      COUNT     = isMobile() ? 35 : 90;
      LINE_DIST = isMobile() ? 80 : 130;
      resize();
    }, 150);
  }, { passive: true });

  /* ── Mysz (desktop) ── */
  let touchRecent = false;
  let touchResetTimer = null;

  window.addEventListener('mousemove', e => {
    if (touchRecent) return; /* ignoruj syntetyczny mousemove generowany przez dotyk */
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  /* ── Dotyk (mobile) — palec odpycha cząsteczki ── */
  function clearTouch() {
    mouse.x = -9999; mouse.y = -9999;
    touchRecent = true;
    clearTimeout(touchResetTimer);
    /* po 600ms zezwól znowu na mousemove (przeglądarka wysyła go ~300ms po touchend) */
    touchResetTimer = setTimeout(() => { touchRecent = false; }, 600);
  }

  canvas.addEventListener('touchstart', () => {
    touchRecent = true;
    clearTimeout(touchResetTimer);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    touchRecent = true;
    const t = e.touches[0];
    mouse.x = t.clientX; mouse.y = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchend',    clearTouch);
  canvas.addEventListener('touchcancel', clearTouch);

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      this.r  = Math.random() * 2 + 0.5;
      this.a  = Math.random() * 0.5 + 0.1;
      this.da = (Math.random() - 0.5) * 0.007;
      this.orbitAngle = Math.random() * Math.PI * 2;
      this.orbitSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.006);
      this.orbitRadX  = 70  + Math.random() * 120;
      this.orbitRadY  = 40  + Math.random() * 80;
    }

    step(gather) {
      const bee = getBeeRect();

      this.orbitAngle += this.orbitSpeed;
      const orbitX = bee.x + Math.cos(this.orbitAngle) * this.orbitRadX;
      const orbitY = bee.y + Math.sin(this.orbitAngle) * this.orbitRadY;

      if (gather > 0.01) {
        const dhx = orbitX - this.x, dhy = orbitY - this.y;
        const dh  = Math.hypot(dhx, dhy) || 1;
        const distBoost = Math.min(4, Math.max(1, dh / 60));
        const pull = gather * 0.03 * distBoost;
        this.vx += (dhx / dh) * pull;
        this.vy += (dhy / dh) * pull;
      } else {
        const cx = W / 2 - this.x, cy = H / 2 - this.y;
        const cd = Math.hypot(cx, cy) || 1;
        this.vx += (cx / cd) * 0.003;
        this.vy += (cy / cd) * 0.003;
      }

      const dmx = this.x - mouse.x, dmy = this.y - mouse.y;
      const dm  = Math.hypot(dmx, dmy) || 1;
      if (dm < 100) {
        const f = (100 - dm) / 100 * 0.8;
        this.vx += (dmx / dm) * f;
        this.vy += (dmy / dm) * f;
      }

      const noise = 0.12 * (1 - gather * 0.75);
      this.vx = this.vx * 0.96 + (Math.random() - 0.5) * noise;
      this.vy = this.vy * 0.96 + (Math.random() - 0.5) * noise;

      const speed = Math.hypot(this.vx, this.vy);
      if (speed > 3) { this.vx = (this.vx / speed) * 3; this.vy = (this.vy / speed) * 3; }

      this.x += this.vx;
      this.y += this.vy;

      this.a += this.da;
      const aMax = 0.65 + gather * 0.3;
      if (this.a > aMax || this.a < 0.08) this.da *= -1;

      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }

    draw(gather) {
      const boost = 1 + gather * 0.8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * boost, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${YELLOW},${this.a})`;
      ctx.fill();
    }
  }

  /* Poświata wokół pszczółki */
  function drawBeeGlow(gather) {
    if (gather <= 0 || !beeLogo) return;
    const bee = getBeeRect();
    const outerR = bee.r * 3.5 + 60;
    const innerR = bee.r * 0.6;
    const alpha  = gather * 0.28;

    const grad = ctx.createRadialGradient(bee.x, bee.y, innerR, bee.x, bee.y, outerR);
    grad.addColorStop(0,   `rgba(255,220,50,${alpha * 1.4})`);
    grad.addColorStop(0.35,`rgba(255,200,0,${alpha})`);
    grad.addColorStop(0.7, `rgba(255,160,0,${alpha * 0.4})`);
    grad.addColorStop(1,   `rgba(255,215,0,0)`);

    ctx.beginPath();
    ctx.arc(bee.x, bee.y, outerR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  resize();
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function drawLines(gather) {
    const lineDist = LINE_DIST + gather * 30;
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        if (Math.abs(dx) > lineDist || Math.abs(dy) > lineDist) continue;
        const d = Math.hypot(dx, dy);
        if (d < lineDist) {
          const baseAlpha = (1 - d / lineDist) * 0.12;
          const alpha = baseAlpha * (1 + gather * 1.2);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${YELLOW},${alpha})`;
          ctx.lineWidth = 0.5 + gather * 0.3;
          ctx.stroke();
        }
      }
    }
  }

  /* easing: ease-in-out cubic */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* Throttle na mobile — 30fps zamiast 60fps */
  let lastFrame = 0;
  const FRAME_INTERVAL = isMobile() ? 33 : 0;

  (function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - lastFrame < FRAME_INTERVAL) return;
    lastFrame = ts;

    if (startTs === null) startTs = ts;
    const elapsed = ts - startTs;
    const raw = Math.max(0, Math.min(1, (elapsed - GATHER_DELAY) / GATHER_DURATION));
    const gather = easeInOut(raw);

    ctx.clearRect(0, 0, W, H);
    drawBeeGlow(gather);
    particles.forEach(p => { p.step(gather); p.draw(gather); });
    drawLines(gather);
  })(0);
}
