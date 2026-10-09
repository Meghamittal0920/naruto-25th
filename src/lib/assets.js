const pad = (n) => String(n).padStart(3, '0');
// Resolved against Vite's base so the site also works from a sub-path (GitHub Pages).
const MEDIA = `${import.meta.env.BASE_URL}media`;
const seq = (dir, count) => Array.from({ length: count }, (_, i) => `${MEDIA}/${dir}/${pad(i + 1)}.webp`);

const SOURCES = {
  swing: seq('swing', 22),
  sage: seq('sage', 58),
  front: `${MEDIA}/front.webp`,
  back: `${MEDIA}/back.webp`,
  lonely: `${MEDIA}/lonely.webp`,
  family: `${MEDIA}/family.webp`,
};

// Filled in by the loaders below; sections read decoded images from here.
export const assets = { swing: [], sage: [], front: null, back: null, lonely: null, family: null };

function load(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    // A still dropped into public/media as .png (no .webp beside it) still loads.
    img.onerror = () => {
      if (img.src.endsWith('.webp') && !src.includes('/sage/') && !src.includes('/swing/')) img.src = src.replace(/\.webp$/, '.png');
      else resolve(img);
    };
    img.src = src;
  });
}

// The swing loop plays inside the preloader, so it has to arrive first.
export async function loadSwing() {
  assets.swing = await Promise.all(SOURCES.swing.map(load));
}

export async function loadRest(onProgress) {
  const stills = ['front', 'back', 'lonely', 'family'];
  const total = SOURCES.sage.length + stills.length;
  let done = 0;
  const tick = (img) => {
    done += 1;
    onProgress?.(done / total);
    return img;
  };
  const [sage, ...rest] = await Promise.all([
    Promise.all(SOURCES.sage.map((s) => load(s).then(tick))),
    ...stills.map((k) => load(SOURCES[k]).then(tick)),
  ]);
  assets.sage = sage;
  stills.forEach((k, i) => (assets[k] = rest[i]));
}

// drawImage rect for object-fit: cover, with a focal point and optional scale.
export function coverRect(img, cw, ch, fx = 0.5, fy = 0.5, scale = 1) {
  const ir = img.width / img.height;
  const cr = cw / ch;
  let w, h;
  if (ir > cr) {
    h = ch;
    w = ch * ir;
  } else {
    w = cw;
    h = cw / ir;
  }
  w *= scale;
  h *= scale;
  return [(cw - w) * fx, (ch - h) * fy, w, h];
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
