import { useEffect, useRef } from 'react';

// Adapted from React Bits <ClickSpark /> (reactbits.dev/animations/click-spark).
export default function ClickSpark({ color = '#ff8a1f', count = 10, size = 14, radius = 34, duration = 480 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let sparks = [];
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter((s) => now - s.start < duration);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const s of sparks) {
        const p = (now - s.start) / duration;
        const eased = p * (2 - p);
        const d = eased * radius;
        const len = size * (1 - eased);
        ctx.beginPath();
        ctx.moveTo(s.x + d * Math.cos(s.a), s.y + d * Math.sin(s.a));
        ctx.lineTo(s.x + (d + len) * Math.cos(s.a), s.y + (d + len) * Math.sin(s.a));
        ctx.stroke();
      }
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const onDown = (e) => {
      const start = performance.now();
      for (let i = 0; i < count; i++) sparks.push({ x: e.clientX, y: e.clientY, a: (Math.PI * 2 * i) / count, start });
      if (!raf) raf = requestAnimationFrame(draw);
    };
    window.addEventListener('pointerdown', onDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [color, count, size, radius, duration]);

  return <canvas className="click-spark" ref={ref} aria-hidden="true" />;
}
