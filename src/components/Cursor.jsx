import { useEffect, useRef } from 'react';

// A ring that trails the pointer and shows the kanji of whatever section it is over.
export default function Cursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const zone = e.target.closest?.('[data-cursor]');
      const label = zone ? zone.dataset.cursor : '';
      if (labelRef.current.textContent !== label) labelRef.current.textContent = label;
      ringRef.current.classList.toggle('is-zone', !!zone);
      ringRef.current.classList.toggle('is-link', !!e.target.closest?.('button, a'));
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ring.x += (pos.x - ring.x) * 0.18;
      ring.y += (pos.y - ring.y) * 0.18;
      dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
    };
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ringRef}>
        <span ref={labelRef} />
      </div>
      <div className="cursor__dot" ref={dotRef} />
    </div>
  );
}
