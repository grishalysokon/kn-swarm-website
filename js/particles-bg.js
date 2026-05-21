/* ──────── BACKGROUND PARTICLES (subpages) ──────── */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isMobile = () => window.innerWidth < 768 || ('ontouchstart' in window);

  const YELLOW = '255,215,0';
  let W, H, particles = [];
  let COUNT     = isMobile() ? 30 : 65;
  let LINE_DIST = isMobile() ? 100 : 150;
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      COUNT     = isMobile() ? 30 : 65;
      LINE_DIST = isMobile() ? 100 : 150;
      resize();
      particles = [];
      for (let i = 0; i < COUNT; i++) particles.push(new Particle());
    }, 150);
  }, { passive: true });

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * (W || window.innerWidth);
      this.y  = Math.random() * (H || window.innerHeight);
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.r  = Math.random() * 1.6 + 0.4;
      this.a  = Math.random() * 0.25 + 0.05;
      this.da = (Math.random() - 0.5) * 0.003;
    }

    step() {
      /* delikatne przyciąganie do środka ekranu (poziomo) */
      const cx = W / 2 - this.x;
      this.vx += (cx / (W / 2)) * 0.002;

      /* odpychanie przez kursor */
      const dmx = this.x - mouse.x;
      const dmy = this.y - mouse.y;
      const dm  = Math.hypot(dmx, dmy) || 1;
      if (dm < 120) {
        const f = (120 - dm) / 120 * 0.5;
        this.vx += (dmx / dm) * f;
        this.vy += (dmy / dm) * f;
      }

      this.vx = this.vx * 0.97 + (Math.random() - 0.5) * 0.04;
      this.vy = this.vy * 0.97 + (Math.random() - 0.5) * 0.04;

      const speed = Math.hypot(this.vx, this.vy);
      if (speed > 1.5) { this.vx = (this.vx / speed) * 1.5; this.vy = (this.vy / speed) * 1.5; }

      this.x += this.vx;
      this.y += this.vy;

      this.a += this.da;
      if (this.a > 0.32 || this.a < 0.04) this.da *= -1;

      if (this.x < -10) this.x = W + 10;
      if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H + 10) this.y = -10;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${YELLOW},${this.a})`;
      ctx.fill();
    }
  }

  function drawLines() {
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        if (Math.abs(dx) > LINE_DIST || Math.abs(dy) > LINE_DIST) continue;
        const d = Math.hypot(dx, dy);
        if (d < LINE_DIST) {
          const alpha = (1 - d / LINE_DIST) * 0.07;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${YELLOW},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  let lastFrame = 0;
  const FRAME_INTERVAL = 33; /* ~30 fps zawsze */

  function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - lastFrame < FRAME_INTERVAL) return;
    lastFrame = ts;

    /* canvas jest fixed, więc nie trzeba przesuwać widoku */
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.step(); p.draw(); });
    drawLines();
  }

  resize();
  for (let i = 0; i < COUNT; i++) particles.push(new Particle());
  requestAnimationFrame(loop);
})();
