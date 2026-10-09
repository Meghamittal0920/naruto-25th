import { useEffect, useRef } from 'react';
import { clamp } from './assets.js';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

// Sizes a canvas to its parent and runs `frame` every animation frame while the
// section is on screen. `frame` gets { ctx, w, h, progress, t, dt } where
// progress is 0..1 across the section's scrollable travel.
export function useStage(sectionRef, canvasRef, frame, onResize) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const resizeRef = useRef(onResize);
  resizeRef.current = onResize;

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = DPR();
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeRef.current?.({ w, h, dpr });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -40 || r.top > vh + 40 || !w) {
        last = now;
        return;
      }
      const travel = r.height - vh;
      const progress = travel > 0 ? clamp(-r.top / travel) : r.top <= 0 ? 1 : 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frameRef.current({ ctx, w, h, progress, t: now / 1000, dt, rect: r });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sectionRef, canvasRef]);
}
