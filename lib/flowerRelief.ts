import { RAREUI_PETALS } from "@/components/logos";

export const RELIEF_SIZE = 1024;

// shader decodes blue as signed distance in [-DIST_RANGE, DIST_RANGE] flower units
export const DIST_RANGE = 0.25;

// alpha holds the same distance over a narrow band, precise enough for crisp edges when magnified
export const EDGE_RANGE = 0.04;

const BEVEL = 0.2;
const SMOOTH_PX = 16;
const PIVOT_X = 131;
const PIVOT_Y = 136;
const FILL = 0.42;
const INF = 1e20;

function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

// seeds hold squared sub-pixel distances to the edge, read from anti-aliased coverage, so the field has no staircase
function distanceTo(seed: Float64Array, n: number) {
  const grid = seed;

  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) f[y] = grid[y * n + x];
    edt1d(f, n, d, v, z);
    for (let y = 0; y < n; y++) grid[y * n + x] = d[y];
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) f[x] = grid[y * n + x];
    edt1d(f, n, d, v, z);
    for (let x = 0; x < n; x++) grid[y * n + x] = Math.sqrt(d[x]);
  }
  return grid;
}

// three box passes approximate a gaussian at a cost that does not grow with the radius
function blur(field: Float64Array, n: number, sigma: number) {
  const radius = Math.max(1, Math.round(sigma));
  const line = new Float64Array(n);
  const pass = (stride: number, step: number) => {
    for (let l = 0; l < n; l++) {
      const base = l * stride;
      for (let i = 0; i < n; i++) line[i] = field[base + i * step];
      let acc = 0;
      for (let i = -radius; i <= radius; i++) acc += line[Math.min(Math.max(i, 0), n - 1)];
      for (let i = 0; i < n; i++) {
        field[base + i * step] = acc / (radius * 2 + 1);
        acc += line[Math.min(i + radius + 1, n - 1)] - line[Math.max(i - radius, 0)];
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(n, 1);
    pass(1, n);
  }
}

function height(d: number) {
  const u = Math.min(Math.max(-d / BEVEL, 0), 1);
  return BEVEL * Math.sqrt(1 - (1 - u) * (1 - u));
}

const CURVE_STEPS = 48;
const BAND_TEXELS = 22;
const CELL = 16;

type Segment = { ax: number; ay: number; bx: number; by: number; side: number };

// petal paths only use absolute M, L, C and Z, which keeps this flattener small
function flattenPetal(d: string, map: (x: number, y: number) => [number, number]) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const points: [number, number][] = [];
  let i = 0;
  let cmd = "";
  let cx = 0;
  let cy = 0;
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLCZ]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === "Z") break;
    if (cmd === "M" || cmd === "L") {
      cx = num();
      cy = num();
      points.push([cx, cy]);
    } else if (cmd === "C") {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      for (let k = 1; k <= CURVE_STEPS; k++) {
        const t = k / CURVE_STEPS;
        const u = 1 - t;
        points.push([
          u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
          u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
        ]);
      }
      cx = x;
      cy = y;
    }
  }
  const mapped = points.map(([x, y]) => map(x, y));
  let area = 0;
  for (let k = 0; k < mapped.length; k++) {
    const [ax, ay] = mapped[k];
    const [bx, by] = mapped[(k + 1) % mapped.length];
    area += ax * by - bx * ay;
  }
  const side = Math.sign(area) || 1;
  const segments: Segment[] = [];
  for (let k = 0; k < mapped.length; k++) {
    const [ax, ay] = mapped[k];
    const [bx, by] = mapped[(k + 1) % mapped.length];
    if (ax !== bx || ay !== by) segments.push({ ax, ay, bx, by, side });
  }
  return segments;
}

// exact signed distance, in texels, to the true curves for every texel near an edge
function refineEdges(signedTexels: Float64Array, n: number, segments: Segment[]) {
  const cells = Math.ceil(n / CELL);
  const buckets: Segment[][] = Array.from({ length: cells * cells }, () => []);
  for (const seg of segments) {
    const x0 = Math.max(0, Math.floor((Math.min(seg.ax, seg.bx) - BAND_TEXELS) / CELL));
    const x1 = Math.min(cells - 1, Math.floor((Math.max(seg.ax, seg.bx) + BAND_TEXELS) / CELL));
    const y0 = Math.max(0, Math.floor((Math.min(seg.ay, seg.by) - BAND_TEXELS) / CELL));
    const y1 = Math.min(cells - 1, Math.floor((Math.max(seg.ay, seg.by) + BAND_TEXELS) / CELL));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) buckets[y * cells + x].push(seg);
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (Math.abs(signedTexels[i]) > BAND_TEXELS - 2) continue;
      const px = x + 0.5;
      const py = y + 0.5;
      let best = INF;
      let sign = 1;
      for (const seg of buckets[Math.floor(py / CELL) * cells + Math.floor(px / CELL)]) {
        const dx = seg.bx - seg.ax;
        const dy = seg.by - seg.ay;
        const t = Math.min(Math.max(((px - seg.ax) * dx + (py - seg.ay) * dy) / (dx * dx + dy * dy), 0), 1);
        const ex = px - (seg.ax + dx * t);
        const ey = py - (seg.ay + dy * t);
        const dist = ex * ex + ey * ey;
        if (dist < best) {
          best = dist;
          sign = Math.sign(dx * (py - seg.ay) - dy * (px - seg.ax)) * seg.side || 1;
        }
      }
      if (best < INF) signedTexels[i] = -sign * Math.sqrt(best);
    }
  }
}

export function buildFlowerRelief() {
  const n = RELIEF_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const scale = (n * FILL) / PIVOT_Y;
  ctx.translate(n / 2, n / 2);
  ctx.scale(scale, scale);
  ctx.translate(-PIVOT_X, -PIVOT_Y);
  ctx.fillStyle = "#000";
  for (const d of RAREUI_PETALS) ctx.fill(new Path2D(d));

  const alpha = ctx.getImageData(0, 0, n, n).data;
  const insideSeed = new Float64Array(n * n);
  const outsideSeed = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) {
    const a = alpha[i * 4 + 3] / 255;
    insideSeed[i] = a >= 0.5 ? 0 : a > 0 ? (0.5 - a) ** 2 : INF;
    outsideSeed[i] = a <= 0.5 ? 0 : a < 1 ? (a - 0.5) ** 2 : INF;
  }

  const toInside = distanceTo(insideSeed, n);
  const toOutside = distanceTo(outsideSeed, n);

  const unit = 2 / n;
  const signed = new Float64Array(n * n);
  const h = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) signed[i] = toInside[i] - toOutside[i];

  const map = (x: number, y: number): [number, number] => [
    (x - PIVOT_X) * scale + n / 2,
    (y - PIVOT_Y) * scale + n / 2,
  ];
  refineEdges(signed, n, RAREUI_PETALS.flatMap((d) => flattenPetal(d, map)));
  for (let i = 0; i < n * n; i++) {
    signed[i] *= unit;
    h[i] = height(signed[i]);
  }

  blur(h, n, SMOOTH_PX);

  const at = (x: number, y: number) =>
    h[Math.min(Math.max(y, 0), n - 1) * n + Math.min(Math.max(x, 0), n - 1)];

  // rows are flipped so texture v runs upward like gl_FragCoord
  const out = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) / (2 * unit);
      const dy = -(at(x, y + 1) - at(x, y - 1)) / (2 * unit);
      const len = Math.hypot(dx, dy, 1);
      const o = ((n - 1 - y) * n + x) * 4;
      out[o] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      out[o + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      out[o + 2] = Math.round(
        Math.min(Math.max(0.5 + signed[y * n + x] / (2 * DIST_RANGE), 0), 1) * 255,
      );
      out[o + 3] = Math.round(
        Math.min(Math.max(0.5 + signed[y * n + x] / (2 * EDGE_RANGE), 0), 1) * 255,
      );
    }
  }
  return out;
}
