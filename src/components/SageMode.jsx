import { useRef } from 'react';
import { assets, clamp, coverRect } from '../lib/assets.js';
import { useStage } from '../lib/useStage.js';

// [from, to] scroll windows for each caption; the last one stays up.
const BEATS = [
  { range: [0.03, 0.22], side: 'right', kanji: '静', title: '動くな。', sub: '自然と、ひとつになれ。' },
  { range: [0.25, 0.46], side: 'left', kanji: '練', title: '自然エネルギー', sub: '仙術チャクラを練り上げろ。' },
  { range: [0.5, 0.74], side: 'right', kanji: '開', title: '開眼', sub: '蝦蟇の瞳が、目を覚ます。' },
];
const FINALE = 0.82;
const RAIL = ['静', '練', '開', '仙'];
const EMBERS = 46;

const window01 = (p, a, b, edge = 0.035) => clamp((p - a) / edge) * clamp((b - p) / edge);

// Section 2 — scroll scrubs the sage-mode awakening frame by frame.
export default function SageMode() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const beatRefs = useRef([]);
  const railRefs = useRef([]);
  const fillRef = useRef(null);
  const finaleRef = useRef(null);
  const flashRef = useRef(null);
  const state = useRef({ p: 0, struck: false, embers: null });

  useStage(sectionRef, canvasRef, ({ ctx, w, h, progress, dt, t }) => {
    const s = state.current;
    const frames = assets.sage;
    if (!frames.length) return;

    // Ease toward the real scroll position so the scrub feels like film, not a stepper.
    s.p += (progress - s.p) * (1 - Math.exp(-dt * 9));
    const p = s.p;

    const img = frames[Math.round(clamp(p / 0.94) * (frames.length - 1))];
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, ...coverRect(img, w, h, 0.5, 0.35));

    // Embers pick up as the chakra builds.
    s.embers ||= Array.from({ length: EMBERS }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.04 + Math.random() * 0.1,
      r: 0.8 + Math.random() * 2.2,
      ph: Math.random() * 6.28,
    }));
    const heat = 0.15 + 0.85 * clamp((p - 0.2) / 0.6);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of s.embers) {
      e.y -= e.v * dt * (0.5 + heat * 1.8);
      if (e.y < -0.05) {
        e.y = 1.05;
        e.x = Math.random();
      }
      const x = (e.x + 0.02 * Math.sin(t * 1.3 + e.ph)) * w;
      ctx.fillStyle = `rgba(255,${130 + Math.round(70 * Math.sin(e.ph) ** 2)},40,${0.55 * heat})`;
      ctx.beginPath();
      ctx.arc(x, e.y * h, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    BEATS.forEach((b, i) => {
      const el = beatRefs.current[i];
      const o = window01(p, b.range[0], b.range[1]);
      const mid = (b.range[0] + b.range[1]) / 2;
      el.style.opacity = o;
      el.style.transform = `translate3d(0, ${(mid - p) * 260}px, 0)`;
      el.style.filter = o > 0.98 ? 'none' : `blur(${(1 - o) * 10}px)`;
    });

    const fin = clamp((p - FINALE) / 0.1);
    finaleRef.current.style.opacity = fin;
    finaleRef.current.style.setProperty('--spread', `${(1 - fin) * 0.6}em`);
    finaleRef.current.style.filter = fin > 0.98 ? 'none' : `blur(${(1 - fin) * 14}px)`;

    // White-out on the frames where the eyes ignite.
    flashRef.current.style.opacity = 0.75 * Math.exp(-(((p - 0.78) / 0.035) ** 2));
    if (p > 0.78 && !s.struck) {
      s.struck = true;
      window.dispatchEvent(new Event('strike'));
    } else if (p < 0.6) {
      s.struck = false;
    }

    fillRef.current.style.transform = `scaleY(${p})`;
    railRefs.current.forEach((el, i) => el.classList.toggle('is-on', p >= [0.03, 0.25, 0.5, FINALE][i]));
  });

  return (
    <section className="sage" ref={sectionRef}>
      <div className="sage__stage">
        <canvas className="stage-canvas" ref={canvasRef} />
        <div className="sage__vignette" />
        <div className="sage__flash" ref={flashRef} />

        <p className="chapter">
          <b>第二章</b>
          <span>仙人モード</span>
        </p>

        <div className="rail" aria-hidden="true">
          <div className="rail__line">
            <i ref={fillRef} />
          </div>
          {RAIL.map((k, i) => (
            <span key={k} ref={(el) => (railRefs.current[i] = el)}>
              {k}
            </span>
          ))}
        </div>

        {BEATS.map((b, i) => (
          <div className={`beat beat--${b.side}`} key={b.kanji} ref={(el) => (beatRefs.current[i] = el)}>
            <span className="beat__ghost" aria-hidden="true">
              {b.kanji}
            </span>
            <h2 className="beat__title">{b.title}</h2>
            <p className="beat__sub">{b.sub}</p>
          </div>
        ))}

        <div className="sage__finale" ref={finaleRef}>
          <p className="sage__finale-top">妙木山 ・ 蝦蟇仙術</p>
          <h2>仙人モード</h2>
          <p className="sage__finale-sub">自然を纏い、忍は仙人となる。</p>
        </div>
      </div>
    </section>
  );
}
