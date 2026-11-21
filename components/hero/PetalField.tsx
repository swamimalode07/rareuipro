"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTheme } from "next-themes";
import { bindFullscreenQuad, createProgram } from "@/lib/webgl";
import { buildFlowerRelief, DIST_RANGE, EDGE_RANGE, RELIEF_SIZE } from "@/lib/flowerRelief";
import { cn } from "@/lib/utils";

const MAX_DPR = 2;
const RESOLUTION_SCALE = 0.9;
const POINTER_EASE = 0.05;

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dark;
uniform vec2 u_pointer;
uniform vec4 u_veil;
uniform sampler2D u_relief;

const float GIANT = 1.4;
const float GIANT_TURN = 0.0;
const float PLEATS = 22.0;

float hash2(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x),
    mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

vec2 rotate(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec4 relief(vec2 q) {
  vec4 t = texture2D(u_relief, q * 0.5 + 0.5);
  float outside = step(1.0, max(abs(q.x), abs(q.y)));
  float coarse = (t.b - 0.5) * ${(DIST_RANGE * 2).toFixed(3)};
  float fine = (t.a - 0.5) * ${(EDGE_RANGE * 2).toFixed(3)};
  float d = abs(coarse) < ${(EDGE_RANGE * 0.9).toFixed(3)} ? fine : coarse;
  return vec4(t.rg * 2.0 - 1.0, 0.0, mix(d, 1.0, outside));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float m = min(u_resolution.x, u_resolution.y);
  float t = u_time;

  float la = 2.2 + u_pointer.x * 0.5 + 0.2 * sin(t * 0.12);
  vec3 light = normalize(vec3(cos(la), sin(la) + u_pointer.y * 0.3, 0.8));
  vec3 half_ = normalize(light + vec3(0.0, 0.0, 1.0));

  float g = m * GIANT;
  vec2 bq = rotate((frag - u_resolution * 0.5) / g, -GIANT_TURN);
  vec4 big = relief(bq);
  float bigCover = smoothstep(2.0 / g, -2.0 / g, big.w);
  float br = length(bq);
  vec2 radial = normalize(bq + 1e-5);
  vec2 around = vec2(-radial.y, radial.x);

  // pleats fan out from the heart and wander slowly, so the satin catches light in moving folds
  float warp = noise(radial * 1.6 + vec2(br * 1.4 - t * 0.04, t * 0.02)) * 3.2;
  float phase = atan(bq.y, bq.x) * PLEATS + warp + br * 4.0;
  vec2 nb = rotate(big.xy * 1.1 + around * cos(phase) * 0.42, GIANT_TURN);
  vec3 n = normalize(vec3(nb, 1.0));
  vec2 fibreDir = rotate(radial, GIANT_TURN);

  float fibre = noise(radial * 95.0 + vec2(0.0, br * 5.0 - t * 0.05)) * 0.6
    + noise(radial * 240.0 + vec2(br * 9.0, 0.0)) * 0.4;
  fibre = smoothstep(0.2, 0.9, fibre);
  float th = dot(vec3(fibreDir, 0.0), half_);
  float sheen = pow(sqrt(max(1.0 - th * th, 0.0)), 40.0);
  float nh = max(dot(n, half_), 0.0);
  float spec = pow(nh, 40.0) * 0.8 + pow(nh, 8.0) * 0.25;
  float lit = max(dot(n, light), 0.0);
  float heart = smoothstep(0.5, 0.12, br);

  vec3 champagne = vec3(0.95, 0.87, 0.78);
  vec3 satin = vec3(0.12, 0.11, 0.105) * (0.2 + 0.95 * lit);
  satin += champagne * (spec * 0.45 + sheen * 0.12) * (0.85 + 0.15 * fibre);
  satin = mix(satin, satin * vec3(1.7, 0.8, 0.45), heart * 0.75);

  // a crisp lit lip and a dark inner edge give each giant petal a clean silhouette
  float lip = smoothstep(-0.018, -0.004, big.w) * smoothstep(0.0, -0.004, big.w);
  vec2 outward = rotate(normalize(big.xy + 1e-5), GIANT_TURN);
  float facing = max(dot(outward, normalize(light.xy)), 0.0);
  satin += champagne * lip * (0.1 + 0.55 * facing);
  satin *= 1.0 - smoothstep(-0.05, -0.012, big.w) * (1.0 - lip) * 0.35;

  float castD = relief(bq + rotate(vec2(0.0, 0.035), -GIANT_TURN)).w;
  float occlude = 1.0 - smoothstep(-0.01, 0.09, castD);
  vec3 gap = vec3(0.012, 0.011, 0.011) * (1.0 - occlude * 0.6);
  vec3 darkCol = mix(gap, satin, bigCover);

  vec3 pearl = vec3(0.985, 0.982, 0.978) * (0.8 + 0.2 * lit) + champagne * spec * 0.12 - fibre * 0.015;
  pearl = mix(pearl, pearl * vec3(1.0, 0.88, 0.8), heart * 0.5);
  vec3 lightGap = vec3(0.925, 0.925, 0.935) - occlude * 0.06;
  vec3 lightCol = mix(lightGap, pearl, bigCover);

  float e = length((frag - u_veil.xy) / max(u_veil.zw, vec2(1.0)));
  float veil = smoothstep(0.45, 1.55, e);
  darkCol *= mix(0.22, 1.0, veil);
  lightCol = mix(vec3(0.961, 0.961, 0.969), lightCol, mix(0.35, 1.0, veil));
  vec3 col = mix(lightCol, darkCol, u_dark);

  col += (hash2(frag + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function PetalField({
  veilRef,
  className,
}: {
  veilRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(1);
  const redrawRef = useRef<() => void>(() => {});
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    darkRef.current = resolvedTheme === "light" ? 0 : 1;
    redrawRef.current();
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const compiled = createProgram(gl, VERT, FRAG);
    const reliefData = buildFlowerRelief();
    if (!compiled || !reliefData) return;

    const { program } = compiled;
    gl.useProgram(program);
    const quad = bindFullscreenQuad(gl, program, "a_pos");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, RELIEF_SIZE, RELIEF_SIZE, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, reliefData,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uResolution = u("u_resolution");
    const uTime = u("u_time");
    const uDark = u("u_dark");
    const uPointer = u("u_pointer");
    const uVeil = u("u_veil");
    gl.uniform1i(u("u_relief"), 0);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const elapsed = () => (performance.now() - startedAt) / 1000;

    let scale = 1;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const measure = () => {
      const box = canvas.getBoundingClientRect();
      const veil = veilRef.current?.getBoundingClientRect();
      if (veil) {
        gl.uniform4f(
          uVeil,
          (veil.left + veil.width / 2 - box.left) * scale,
          (box.bottom - (veil.top + veil.height / 2)) * scale,
          (veil.width / 2) * scale,
          (veil.height / 2) * scale,
        );
      }
    };

    const draw = () => {
      const t = reduceMotion ? 0 : elapsed();
      pointer.x += (pointer.tx - pointer.x) * POINTER_EASE;
      pointer.y += (pointer.ty - pointer.y) * POINTER_EASE;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uDark, darkRef.current);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    redrawRef.current = draw;

    let frame = 0;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (frame || reduceMotion) return;
      frame = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      scale = Math.min(window.devicePixelRatio || 1, MAX_DPR) * RESOLUTION_SCALE;
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uResolution, w, h);
      }
      measure();
      draw();
    };

    const onPointer = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.tx = ((event.clientX - box.left) / box.width) * 2 - 1;
      pointer.ty = -(((event.clientY - box.top) / box.height) * 2 - 1);
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    if (veilRef.current) resizeObserver.observe(veilRef.current);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) play();
      else pause();
    });
    visibilityObserver.observe(canvas);

    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      pause();
      redrawRef.current = () => {};
      window.removeEventListener("pointermove", onPointer);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      gl.deleteTexture(texture);
      gl.deleteBuffer(quad);
      compiled.dispose();
    };
  }, [veilRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
