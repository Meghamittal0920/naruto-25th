import { useRef } from 'react';
import { assets, clamp, coverRect } from '../lib/assets.js';
import { useStage } from '../lib/useStage.js';

const LINES = [
  { at: 0.12, text: '誰も、オレを見てくれなかった。' },
  { at: 0.34, text: 'ブランコだけが、オレの居場所だった。' },
  { at: 0.56, text: 'それでも ―― 諦めなかった。' },
];
const RAIN = 90;

// Section 3a — the swing. Scroll pushes the camera in on a boy nobody is waiting for.
export default function Swing() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const titleRef = useRef(null);
  const lineRefs = useRef([]);
  const fadeRef = useRef(null);
  const state = useRef({ p: 0, rain: null });

  useStage(sectionRef, canvasRef, ({ ctx, w, h, progress, dt }) => {
    const s = state.current;
    const frames = assets.swing;
    if (!frames.length) return;
    s.p += (progress - s.p) * (1 - Math.exp(-dt * 8));
    const p = s.p;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const img = frames[Math.round(clamp(p / 0.82) * (frames.length - 1))];
    ctx.drawImage(img, ...coverRect(img, w, h, 0.5, 0));

    s.rain ||= Array.from({ length: RAIN }, () => ({
      x: Math.random() * 1.2,
      y: Math.random(),
      v: 0.9 + Math.random() * 0.9,
      l: 0.03 + Math.random() * 0.05,
    }));
    ctx.strokeStyle = 'rgba(150,180,230,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of s.rain) {
      d.y += d.v * dt;
      if (d.y > 1.1) {
        d.y = -0.1;
        d.x = Math.random() * 1.2;
      }
      const x = d.x * w - d.y * h * 0.12;
      ctx.moveTo(x, d.y * h);
      ctx.lineTo(x - d.l * h * 0.12, (d.y + d.l) * h);
    }
    ctx.stroke();

    titleRef.current.style.opacity = clamp(p / 0.06) * clamp((0.9 - p) / 0.06);
    titleRef.current.style.transform = `translate3d(0, ${(0.4 - p) * 90}px, 0)`;
    LINES.forEach((line, i) => {
      const el = lineRefs.current[i];
      const o = clamp((p - line.at) / 0.06) * clamp((0.9 - p) / 0.06);
      el.style.opacity = o;
      el.style.transform = `translate3d(${(1 - clamp((p - line.at) / 0.06)) * -28}px, 0, 0)`;
    });
    // Sink into black so the last chapter starts from nothing.
    fadeRef.current.style.opacity = clamp((p - 0.88) / 0.1);
  });

  return (
    <section className="swing" ref={sectionRef}>
      <div className="swing__stage">
        <canvas className="stage-canvas swing__canvas" ref={canvasRef} />
        <div className="swing__vignette" />

        <p className="chapter chapter--cold">
          <b>第三章</b>
          <span>孤独</span>
        </p>

        <h2 className="swing__title" ref={titleRef}>
          ひとりぼっち
        </h2>

        <div className="swing__lines">
          {LINES.map((line, i) => (
            <p key={line.text} ref={(el) => (lineRefs.current[i] = el)}>
              {line.text}
            </p>
          ))}
        </div>

        <div className="swing__fade" ref={fadeRef} />
      </div>
    </section>
  );
}
