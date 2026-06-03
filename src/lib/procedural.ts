import type {PlanetStyle} from '@/data/types';

/** Parse a 24-bit hex colour number to {r,g,b} in 0..1, no three.js needed. */
export function rgb(hex: number): {r: number; g: number; b: number} {
  return {
    r: ((hex >> 16) & 255) / 255,
    g: ((hex >> 8) & 255) / 255,
    b: (hex & 255) / 255,
  };
}

// ---------- value-noise helpers (ported verbatim from prototype) ----------

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number): number {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < 5; i++) {
    s += amp * vnoise(x * f, y * f);
    f *= 2;
    amp *= 0.5;
  }
  return Math.min(1, Math.max(0, s));
}

// ---------- colour math helpers (replacing THREE.Color) ----------

type RGBA = {r: number; g: number; b: number; a?: number};

function clr(r: number, g: number, b: number): RGBA { return {r, g, b}; }
function lerp(a: RGBA, b: RGBA, t: number): RGBA {
  return {r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t};
}
function mul(a: RGBA, s: number): RGBA {
  return {r: a.r * s, g: a.g * s, b: a.b * s};
}
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

// ---------- exported canvas generators ----------

/**
 * planetCanvas — port of prototype `planetTexture(hex, style)`.
 * Returns a 512×256 HTMLCanvasElement; caller wraps in THREE.CanvasTexture.
 */
export function planetCanvas(hex: number, style: PlanetStyle): HTMLCanvasElement {
  const Wt = 512, Ht = 256;
  const cv = document.createElement('canvas');
  cv.width = Wt; cv.height = Ht;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(Wt, Ht);
  const d = img.data;

  const base = rgb(hex);
  const dark = mul(base, 0.42);
  const light = lerp(base, clr(1, 1, 1), 0.5);

  // named colours used for earth/lava/ice styles
  const land  = clr(0x3f / 255, 0x8a / 255, 0x52 / 255);
  const deep  = clr(0x0a / 255, 0x2f / 255, 0x6b / 255);
  const ocean = clr(0x1d / 255, 0x63 / 255, 0xc9 / 255);
  const ice   = clr(0xe6 / 255, 0xf6 / 255, 0xff / 255);
  const hot   = clr(0xff / 255, 0x7a / 255, 0x2c / 255);
  const hot2  = clr(0xff / 255, 0xe0 / 255, 0x8a / 255);

  const sc = style === 'gas' ? 4 : style === 'rock' ? 9 : 6;

  for (let y = 0; y < Ht; y++) {
    for (let x = 0; x < Wt; x++) {
      const n = fbm(x / Wt * sc * 2, y / Ht * sc);
      let c: RGBA;
      if (style === 'gas') {
        const band = Math.sin(y / Ht * Math.PI * 8 + n * 3) * 0.5 + 0.5;
        c = lerp(dark, light, clamp01(band * 0.65 + n * 0.5));
      } else if (style === 'earth') {
        if (n > 0.52) {
          c = lerp(land, clr(0x27 / 255, 0x4d / 255, 0x2f / 255), (n - 0.52) / 0.48);
        } else {
          c = lerp(ocean, deep, (0.52 - n) / 0.52 * 0.7);
        }
        if (n > 0.93) c = ice;
      } else if (style === 'lava') {
        c = lerp(dark, light, n);
        if (n > 0.66) c = lerp(hot, hot2, (n - 0.66) / 0.34);
      } else if (style === 'ice') {
        c = lerp(base, ice, clamp01(n * 1.15));
      } else {
        // 'rock' and fallback
        c = lerp(dark, light, n);
      }
      const i = (y * Wt + x) * 4;
      d[i]     = c.r * 255;
      d[i + 1] = c.g * 255;
      d[i + 2] = c.b * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/**
 * cloudCanvas — port of prototype `cloudTexture()`.
 * Returns a 512×256 HTMLCanvasElement.
 */
export function cloudCanvas(): HTMLCanvasElement {
  const Wt = 512, Ht = 256;
  const cv = document.createElement('canvas');
  cv.width = Wt; cv.height = Ht;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(Wt, Ht);
  const d = img.data;
  for (let y = 0; y < Ht; y++) {
    for (let x = 0; x < Wt; x++) {
      const n = fbm(x / Wt * 7 + 50, y / Ht * 4 + 50);
      const a = n > 0.58 ? Math.min(1, (n - 0.58) / 0.3) : 0;
      const i = (y * Wt + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = a * 230;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

/**
 * radialCanvas — port of prototype `radial(c0, s1, c1, c2)`.
 * Returns a 128×128 HTMLCanvasElement with a radial gradient.
 */
export function radialCanvas(c0: string, s1: number, c1: string, c2: string): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, c0);
  g.addColorStop(s1, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return cv;
}

/**
 * galaxyCanvas — port of prototype `galaxyTex()`.
 * Returns a 256×256 HTMLCanvasElement.
 */
export function galaxyCanvas(): HTMLCanvasElement {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d')!;
  const cx = S / 2, cy = S / 2;

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, S / 2);
  core.addColorStop(0, 'rgba(255,255,255,0.95)');
  core.addColorStop(0.18, 'rgba(220,230,255,0.6)');
  core.addColorStop(0.55, 'rgba(150,180,255,0.16)');
  core.addColorStop(1, 'rgba(120,150,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  for (let a = 0; a < 280; a++) {
    const t = (a / 280) * Math.PI * 6;
    const rr = (a / 280) * S * 0.48;
    const pxx = cx + Math.cos(t) * rr;
    const pyy = cy + Math.sin(t) * rr * 0.5;
    ctx.fillStyle = `rgba(205,218,255,${0.5 * (1 - a / 280)})`;
    ctx.beginPath();
    ctx.arc(pxx, pyy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return cv;
}
