import { useEffect, useRef } from 'react';
import { assets } from '../lib/assets.js';

const FPS = 11;

// The swing clip loops (ping-pong) while everything else streams in.
export default function Preloader({ progress, swingReady, done }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!swingReady || done) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames = assets.swing;
    const span = frames.length * 2 - 2;
    let raf = 0;
    const start = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const step = Math.floor(((now - start) / 1000) * FPS) % span;
      const img = frames[step < frames.length ? step : span - step];
      // Crop to the middle of the frame, where he sits.
      ctx.drawImage(img, img.width * 0.2, 0, img.width * 0.6, img.height, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [swingReady, done]);

  return (
    <div className={`preloader ${done ? 'is-done' : ''}`} aria-hidden={done}>
      <canvas className="preloader__swing" ref={canvasRef} width={512} height={480} />
      <p className="preloader__jp">読み込み中</p>
      <div className="preloader__bar">
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p className="preloader__pct">{String(Math.round(progress * 100)).padStart(3, '0')}</p>
      <p className="preloader__tag">NARUTO ・ 二十五周年</p>
    </div>
  );
}
