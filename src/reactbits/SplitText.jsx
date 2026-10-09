import { useEffect, useRef } from 'react';

// Adapted from React Bits <SplitText /> (reactbits.dev/text-animations/split-text):
// per-character rise + blur-in, staggered, fired when the text scrolls into view.
export default function SplitText({ text, as: Tag = 'span', className = '', delay = 45, start = 0, show }) {
  const ref = useRef(null);
  const controlled = show !== undefined;

  useEffect(() => {
    if (controlled) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle('is-in', entry.isIntersecting),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controlled]);

  return (
    <Tag ref={ref} className={`split ${className} ${controlled && show ? 'is-in' : ''}`} aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="split__ch" aria-hidden="true" key={i} style={{ transitionDelay: `${start + i * delay}ms` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </Tag>
  );
}
