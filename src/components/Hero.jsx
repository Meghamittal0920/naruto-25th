import { useRef } from 'react';
import { assets, coverRect } from '../lib/assets.js';
import { useStage } from '../lib/useStage.js';
import SplitText from '../reactbits/SplitText.jsx';

const TRAIL_LENGTH = 60;

// Section 1 — the daylight Naruto, with sage mode burning through wherever the cursor has been.
export default function Hero({ ready }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const hintRef = useRef(null);
  const state = useRef({
    mouse: { x: -9999, y: -9999 },
    smooth: { x: -9999, y: -9999 },
    trail: [],
    touched: false,
    off: null,
    radius: 190,
  });

  const onMove = (e) => {
    const s = state.current;
    const r = sectionRef.current.getBoundingClientRect();
    s.mouse.x = e.clientX - r.left;
    s.mouse.y = e.clientY - r.top;
    if (!s.touched) {
      s.touched = true;
      hintRef.current.style.opacity = 0;
    }
  };

  useStage(
    sectionRef,
    canvasRef,
    ({ ctx, w, h, t }) => {
      const s = state.current;
      const { front, back } = assets;
      if (!front || !back || !s.off) return;

      // Until the visitor moves, wander on its own so the reveal is discoverable.
      if (!s.touched) {
        s.mouse.x = w * (0.52 + 0.3 * Math.sin(t * 0.7));
        s.mouse.y = h * (0.42 + 0.22 * Math.sin(t * 1.1 + 1.3));
        if (s.smooth.x < -999) Object.assign(s.smooth, s.mouse);
      }
      if (s.smooth.x < -999) Object.assign(s.smooth, s.mouse);
      s.smooth.x += (s.mouse.x - s.smooth.x) * 0.13;
      s.smooth.y += (s.mouse.y - s.smooth.y) * 0.13;
      s.trail.unshift({ x: s.smooth.x, y: s.smooth.y });
      if (s.trail.length > TRAIL_LENGTH) s.trail.length = TRAIL_LENGTH;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(front, ...coverRect(front, w, h, 0.5, 0.62));

      const offc = s.off.getContext('2d');
      offc.globalCompositeOperation = 'source-over';
      offc.clearRect(0, 0, w, h);
      for (let i = 0; i < s.trail.length; i++) {
        const k = 1 - i / s.trail.length;
        offc.beginPath();
        offc.arc(s.trail[i].x, s.trail[i].y, s.radius * (0.25 + 0.75 * k), 0, Math.PI * 2);
        offc.fillStyle = `rgba(0,0,0,${Math.pow(k, 1.5)})`;
        offc.fill();
      }
      offc.globalCompositeOperation = 'source-in';
      offc.drawImage(back, ...coverRect(back, w, h, 0.5, 0.62));
      ctx.drawImage(s.off, 0, 0, w, h);

      const head = s.trail[0];
      const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, s.radius * 1.45);
      glow.addColorStop(0, 'rgba(255,236,200,0.26)');
      glow.addColorStop(0.45, 'rgba(255,122,26,0.13)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, s.radius * 1.45, 0, Math.PI * 2);
      ctx.fill();
    },
    ({ w, h, dpr }) => {
      const s = state.current;
      s.off ||= document.createElement('canvas');
      s.off.width = Math.round(w * dpr);
      s.off.height = Math.round(h * dpr);
      s.off.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      s.radius = Math.max(130, Math.min(w, h) * 0.24);
    },
  );

  return (
    <section className="hero" ref={sectionRef} onPointerMove={onMove} data-cursor="覚">
      <canvas className="stage-canvas" ref={canvasRef} />
      <div className="hero__shade" />

      <div className={`hero__quote ${ready ? 'is-in' : ''}`}>
        <SplitText text="まっすぐ自分の言葉は曲げねえ" show={ready} start={500} delay={55} />
        <SplitText text="それがオレの忍道だ" show={ready} start={1300} delay={55} className="hero__quote-2" />
      </div>

      <div className={`seal ${ready ? 'is-in' : ''}`} aria-label="祝 二十五周年">
        <svg viewBox="0 0 200 200" className="seal__ring" aria-hidden="true">
          <defs>
            <path id="seal-arc" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#seal-arc">NARUTO ・ 二十五周年 ・ ANNIVERSARY ・ 木ノ葉隠れの里 ・</textPath>
          </text>
        </svg>
        <span className="seal__num">25</span>
        <span className="seal__kanji">周年</span>
      </div>

      <div className="hint" ref={hintRef}>
        ◂ カーソルで仙人の力を呼び覚ませ ▸
      </div>
      <div className="scroll-cue">
        <span>スクロール</span>
        <i />
      </div>
    </section>
  );
}
