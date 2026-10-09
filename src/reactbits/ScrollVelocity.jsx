import { useEffect, useRef } from 'react';

// Adapted from React Bits <ScrollVelocity /> (reactbits.dev/text-animations/scroll-velocity):
// marquee rows that drift on their own and surge / reverse with scroll speed.
export default function ScrollVelocity({ texts, velocity = 60, className = '' }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const rows = [...root.querySelectorAll('.sv__row')].map((el, i) => ({
      el,
      copy: el.firstElementChild,
      x: 0,
      dir: i % 2 ? 1 : -1,
    }));
    let lastY = window.scrollY;
    let boost = 0;
    let flip = 1;
    let last = performance.now();
    let raf = 0;

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      boost += (dy / Math.max(dt, 0.001) - boost) * 0.12;
      if (Math.abs(dy) > 0.5) flip = dy > 0 ? 1 : -1;

      const r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;

      for (const row of rows) {
        const width = row.copy.offsetWidth;
        if (!width) continue;
        row.x += row.dir * flip * (velocity + Math.min(1400, Math.abs(boost)) * 0.9) * dt;
        row.x = ((row.x % width) + width) % width;
        row.el.style.transform = `translate3d(${row.x - width}px,0,0)`;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [velocity]);

  return (
    <div className={`sv ${className}`} ref={rootRef} aria-hidden="true">
      {texts.map((text, i) => (
        <div className="sv__track" key={i}>
          <div className="sv__row">
            {Array.from({ length: 8 }, (_, n) => (
              <span className="sv__copy" key={n}>
                {text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
