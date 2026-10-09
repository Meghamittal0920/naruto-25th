import { useMemo } from 'react';

// Adapted from React Bits <Noise /> (reactbits.dev/animations/noise): animated film grain.
// One generated tile, jittered with CSS steps instead of repainting a canvas every frame.
export default function Noise({ alpha = 26 }) {
  const tile = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = alpha;
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }, [alpha]);

  return <div className="noise" style={{ backgroundImage: `url(${tile})` }} aria-hidden="true" />;
}
