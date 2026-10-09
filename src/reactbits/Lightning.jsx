import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/assets.js';

// Adapted from React Bits <Lightning /> (reactbits.dev/backgrounds/lightning).
// Same fbm bolt shader, but instead of a permanent bolt it fires short strikes
// from the top of the viewport at random intervals over the whole app.

const VERT = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHue;
uniform float uXOffset;
uniform float uSpeed;
uniform float uIntensity;
uniform float uSize;
uniform float uReach;

#define OCTAVE_COUNT 10

vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}
float hash11(float p) {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
mat2 rotate2d(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat2(c, -s, s, c);
}
float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float a = hash12(ip);
  float b = hash12(ip + vec2(1.0, 0.0));
  float c = hash12(ip + vec2(0.0, 1.0));
  float d = hash12(ip + vec2(1.0, 1.0));
  vec2 t = smoothstep(0.0, 1.0, fp);
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < OCTAVE_COUNT; ++i) {
    value += amplitude * noise(p);
    p *= rotate2d(0.45);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 st = gl_FragCoord.xy / iResolution.xy;
  vec2 uv = 2.0 * st - 1.0;
  uv.x *= iResolution.x / iResolution.y;
  uv.x += uXOffset;
  uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;

  float dist = abs(uv.x);
  vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
  vec3 col = baseColor * (mix(0.02, 0.07, hash11(iTime * uSpeed)) / dist) * uIntensity;

  // The bolt drops in from the top edge and dies out at uReach.
  col *= smoothstep(uReach, uReach + 0.4, st.y);
  gl_FragColor = vec4(col, 1.0);
}
`;

const STRIKE_MS = 720;
// Mostly chakra-blue bolts, with the odd orange one.
const HUES = [212, 212, 28];
const pulse = (t, at, width) => Math.exp(-(((t - at) / width) ** 2));
const envelope = (t) => Math.max(pulse(t, 0.08, 0.05), 0.8 * pulse(t, 0.33, 0.07), 0.45 * pulse(t, 0.62, 0.14));

export default function Lightning({ active = true, minGap = 4500, maxGap = 9500, hues = HUES, size = 1.1 }) {
  const canvasRef = useRef(null);
  const flashRef = useRef(null);

  useEffect(() => {
    if (!active || reducedMotion()) return;
    const canvas = canvasRef.current;
    const flash = flashRef.current;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    ['iResolution', 'iTime', 'uHue', 'uXOffset', 'uSpeed', 'uIntensity', 'uSize', 'uReach'].forEach(
      (n) => (u[n] = gl.getUniformLocation(program, n)),
    );

    const resize = () => {
      // Strikes are soft and brief, so render at reduced resolution.
      canvas.width = Math.round(window.innerWidth * 0.6);
      canvas.height = Math.round(window.innerHeight * 0.6);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let timer = 0;
    let striking = false;

    const strike = () => {
      if (striking || document.hidden) return;
      striking = true;
      const start = performance.now();
      const seed = Math.random() * 100;
      const aspect = canvas.width / canvas.height;
      const at = 0.1 + Math.random() * 0.8;
      const hue = hues[Math.floor(Math.random() * hues.length)];
      const reach = Math.random() < 0.35 ? -0.5 : Math.random() * 0.45;

      canvas.style.visibility = 'visible';
      flash.style.setProperty('--x', `${at * 100}%`);
      flash.style.setProperty('--tint', hue < 100 ? '255, 170, 80' : '150, 200, 255');
      gl.uniform2f(u.iResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uHue, hue);
      gl.uniform1f(u.uXOffset, -(2 * at - 1) * aspect);
      gl.uniform1f(u.uSpeed, 1);
      gl.uniform1f(u.uSize, size);
      gl.uniform1f(u.uReach, reach);

      const render = (now) => {
        const t = (now - start) / STRIKE_MS;
        if (t >= 1) {
          striking = false;
          canvas.style.visibility = 'hidden';
          flash.style.opacity = 0;
          return;
        }
        const e = envelope(t);
        gl.uniform1f(u.iTime, seed + (now - start) / 1000);
        gl.uniform1f(u.uIntensity, e * 1.5);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        flash.style.opacity = e * 0.5;
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
    };

    const schedule = () => {
      timer = window.setTimeout(() => {
        strike();
        schedule();
      }, minGap + Math.random() * (maxGap - minGap));
    };
    timer = window.setTimeout(() => {
      strike();
      schedule();
    }, 1400);

    // Sections can call down a bolt at story beats: window.dispatchEvent(new Event('strike')).
    window.addEventListener('strike', strike);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('strike', strike);
    };
  }, [active, minGap, maxGap, hues, size]);

  return (
    <div className="lightning" aria-hidden="true">
      <div className="lightning__flash" ref={flashRef} />
      <canvas className="lightning__canvas" ref={canvasRef} />
    </div>
  );
}
