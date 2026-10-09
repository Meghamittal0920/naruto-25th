import { useRef, useState } from 'react';
import { assets, clamp, coverRect } from '../lib/assets.js';
import { useStage } from '../lib/useStage.js';
import SplitText from '../reactbits/SplitText.jsx';

const GRID_X = 40;
const GRID_Y = 24;
const COMPLETE_AT = 0.38;
const BURST_SECONDS = 1.7;

// Section 3b — the last transition. Unlike the hero's fading trail, this brush is
// permanent: every stroke paints someone into the dark beside him, and once enough of
// the dark is gone the rest of the family floods in.
export default function Bonds() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const meterRef = useRef(null);
  const pctRef = useRef(null);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const state = useRef({
    mask: null,
    off: null,
    dpr: 1,
    grid: new Uint8Array(GRID_X * GRID_Y),
    filled: 0,
    last: null,
    head: { x: -9999, y: -9999, on: false },
    sparks: [],
    burst: -1,
    complete: false,
    radius: 80,
  });

  const stamp = (x, y, angle, r, w, h) => {
    const s = state.current;
    const m = s.mask.getContext('2d');
    m.save();
    m.translate(x, y);
    m.rotate(angle);
    m.fillStyle = '#000';
    m.globalAlpha = 0.5;
    m.beginPath();
    m.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
    m.fill();
    // Dry-brush bristles: ragged streaks trailing off the main body of the stroke.
    for (let k = 0; k < 6; k++) {
      const rr = r * (0.06 + Math.random() * 0.2);
      m.globalAlpha = 0.25 + Math.random() * 0.35;
      m.beginPath();
      m.ellipse((Math.random() - 0.5) * 2.6 * r, (Math.random() - 0.5) * 1.5 * r, rr * 3, rr, 0, 0, Math.PI * 2);
      m.fill();
    }
    m.restore();

    const gx0 = Math.max(0, Math.floor(((x - r) / w) * GRID_X));
    const gx1 = Math.min(GRID_X - 1, Math.floor(((x + r) / w) * GRID_X));
    const gy0 = Math.max(0, Math.floor(((y - r * 0.7) / h) * GRID_Y));
    const gy1 = Math.min(GRID_Y - 1, Math.floor(((y + r * 0.7) / h) * GRID_Y));
    for (let gy = gy0; gy <= gy1; gy++)
      for (let gx = gx0; gx <= gx1; gx++) {
        const i = gy * GRID_X + gx;
        if (!s.grid[i]) {
          s.grid[i] = 1;
          s.filled += 1;
        }
      }
    if (Math.random() < 0.5)
      s.sparks.push({ x, y, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 70, life: 1, r: 1 + Math.random() * 2 });
  };

  const onMove = (e) => {
    const s = state.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    s.head = { x, y, on: true };
    if (s.complete || !s.mask) return;
    if (!started) setStarted(true);

    const w = rect.width;
    const h = rect.height;
    const prev = s.last || { x, y };
    const dx = x - prev.x;
    const dy = y - prev.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    // A fast stroke thins out, like a brush running dry.
    const r = s.radius * clamp(1.15 - dist / 260, 0.55, 1.15);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.3)));
    for (let i = 1; i <= steps; i++) stamp(prev.x + (dx * i) / steps, prev.y + (dy * i) / steps, angle, r, w, h);
    s.last = { x, y };

    if (s.filled / s.grid.length >= COMPLETE_AT) {
      s.complete = true;
      s.burst = 0;
      setDone(true);
      window.dispatchEvent(new Event('strike'));
    }
  };

  const onLeave = () => {
    state.current.last = null;
    state.current.head.on = false;
  };

  const reset = () => {
    const s = state.current;
    const m = s.mask.getContext('2d');
    m.clearRect(0, 0, s.mask.width, s.mask.height);
    s.grid.fill(0);
    s.filled = 0;
    s.complete = false;
    s.burst = -1;
    s.last = null;
    setDone(false);
    setStarted(false);
  };

  useStage(
    sectionRef,
    canvasRef,
    ({ ctx, w, h, dt }) => {
      const s = state.current;
      const { lonely, family } = assets;
      if (!lonely || !family || !s.mask) return;
      // Inset and anchored to the floor, leaving headroom for the title.
      const full = coverRect(lonely, w, h);
      const rect = coverRect(lonely, w, h, 0.5, 1, (0.84 * h) / full[3]);

      if (s.burst >= 0 && s.burst < 1) {
        s.burst = Math.min(1, s.burst + dt / BURST_SECONDS);
        const eased = 1 - Math.pow(1 - s.burst, 3);
        const m = s.mask.getContext('2d');
        m.globalAlpha = 1;
        m.fillStyle = '#000';
        m.beginPath();
        m.arc(w / 2, h * 0.62, eased * Math.hypot(w, h), 0, Math.PI * 2);
        m.fill();
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.filter = 'saturate(0.4) brightness(0.72)';
      ctx.drawImage(lonely, ...rect);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(10,18,44,0.32)';
      ctx.fillRect(...rect);

      const offc = s.off.getContext('2d');
      offc.globalCompositeOperation = 'source-over';
      offc.clearRect(0, 0, w, h);
      offc.drawImage(s.mask, 0, 0, w, h);
      offc.globalCompositeOperation = 'source-in';
      offc.fillStyle = '#000';
      offc.fillRect(0, 0, w, h);
      offc.globalCompositeOperation = 'source-atop';
      offc.drawImage(family, ...rect);
      ctx.drawImage(s.off, 0, 0, w, h);

      // Feather the picture's own borders into the black page.
      const [rx, ry, rw, rh] = rect;
      const feather = (x0, y0, x1, y1, fx, fy, fw, fh) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, '#000');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(fx, fy, fw, fh);
      };
      const edge = rw * 0.07;
      feather(rx, 0, rx + edge, 0, rx - 1, ry, edge + 1, rh);
      feather(rx + rw, 0, rx + rw - edge, 0, rx + rw - edge, ry, edge + 1, rh);
      feather(0, ry, 0, ry + rh * 0.12, rx, ry - 1, rw, rh * 0.12 + 1);

      ctx.globalCompositeOperation = 'lighter';
      s.sparks = s.sparks.filter((p) => p.life > 0);
      for (const p of s.sparks) {
        p.life -= dt * 1.1;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.fillStyle = `rgba(255,${150 + Math.round(60 * p.life)},60,${Math.max(0, p.life) * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.head.on && !s.complete) {
        const g = ctx.createRadialGradient(s.head.x, s.head.y, 0, s.head.x, s.head.y, s.radius * 1.6);
        g.addColorStop(0, 'rgba(255,190,110,0.22)');
        g.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.head.x, s.head.y, s.radius * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.burst >= 0 && s.burst < 1) {
        ctx.fillStyle = `rgba(255,214,160,${0.5 * Math.pow(1 - s.burst, 2)})`;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.globalCompositeOperation = 'source-over';

      const bond = s.complete ? 1 : clamp(s.filled / s.grid.length / COMPLETE_AT);
      meterRef.current.style.transform = `scaleY(${bond})`;
      pctRef.current.textContent = `${Math.round(bond * 100)}`;
    },
    ({ w, h, dpr }) => {
      const s = state.current;
      const mask = document.createElement('canvas');
      mask.width = Math.round(w * dpr);
      mask.height = Math.round(h * dpr);
      const m = mask.getContext('2d');
      m.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep what has already been painted when the window is resized.
      if (s.mask) m.drawImage(s.mask, 0, 0, w, h);
      if (s.complete) m.fillRect(0, 0, w, h);
      s.mask = mask;
      s.off ||= document.createElement('canvas');
      s.off.width = mask.width;
      s.off.height = mask.height;
      s.off.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      s.radius = Math.max(54, Math.min(w, h) * 0.105);
    },
  );

  return (
    <section
      className={`bonds ${done ? 'is-done' : ''}`}
      ref={sectionRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor="筆"
    >
      <canvas className="stage-canvas" ref={canvasRef} />

      <p className="chapter chapter--cold bonds__chapter">
        <b>終章</b>
        <span>{done ? '絆' : '闇'}</span>
      </p>

      <div className="bonds__head">
        {done ? (
          <>
            <SplitText as="h2" key="after" text="もう、ひとりじゃない。" className="bonds__title bonds__title--warm" delay={70} />
            <p className="bonds__thanks">ありがとう、ナルト。 ―― 二十五周年</p>
          </>
        ) : (
          <SplitText as="h2" key="before" text="オレは、ひとりだった。" className="bonds__title" delay={70} />
        )}
      </div>

      <div className="meter" aria-hidden="true">
        <span className="meter__label">絆</span>
        <div className="meter__bar">
          <i ref={meterRef} />
        </div>
        <span className="meter__pct">
          <b ref={pctRef}>0</b>%
        </span>
      </div>

      <div className={`hint bonds__hint ${started ? 'is-hidden' : ''}`}>筆で闇を塗りつぶせ ―― 仲間を描き出せ</div>

      <button className="again" type="button" onClick={reset} tabIndex={done ? 0 : -1}>
        もう一度
      </button>
    </section>
  );
}
