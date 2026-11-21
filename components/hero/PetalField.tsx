"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTheme } from "next-themes";
import { bindFullscreenQuad, createProgram } from "@/lib/webgl";
import { buildFlowerMaps, HEIGHT_DOWNSCALE } from "@/lib/flowerMask";
import { cn } from "@/lib/utils";

const MAX_DPR = 2;
const TOUCH_DPR = 1.5;
// keeps 4k and 5k displays smooth; below this budget the canvas renders at full device resolution
const MAX_PIXELS = 6_000_000;
const GIANT = 1.4;
const BEVEL = 0.11;
const POINTER_EASE = 0.06;

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dark;
uniform vec2 u_pointer;
uniform vec4 u_veil;
uniform float u_radius;
uniform float u_bevel;
uniform float u_px;
uniform vec4 u_heightInfo;
uniform sampler2D u_mask;
uniform sampler2D u_height;

const float PLEATS = 40.0;
const vec3 CHAMPAGNE = vec3(0.95, 0.87, 0.78);

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

float cover(vec2 frag) {
  return texture2D(u_mask, frag / u_resolution).a;
}

// the blurred mask is an s-curve across the edge; squaring its complement turns it into a rounded dome
float dome(vec2 frag) {
  vec2 uv = (frag / ${HEIGHT_DOWNSCALE.toFixed(1)} + u_heightInfo.xy) / u_heightInfo.zw;
  float h = texture2D(u_height, uv).a;
  return 1.0 - (1.0 - h) * (1.0 - h);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float t = u_time;

  float e = length((frag - u_veil.xy) / max(u_veil.zw, vec2(1.0)));
  float veil = smoothstep(0.45, 1.55, e);

  float shadowH = dome(frag + vec2(0.0, 0.035 * u_radius));
  float occlude = smoothstep(0.0, 0.7, shadowH);
  vec3 darkGap = vec3(0.012, 0.011, 0.011) * (1.0 - occlude * 0.6);
  vec3 lightGap = vec3(0.925, 0.925, 0.935) - occlude * 0.06;

  float c = cover(frag);
  float grain = (hash2(frag + fract(t)) - 0.5) / 255.0;

  // the gaps are most of the frame and need none of the satin work below
  if (c <= 0.0) {
    vec3 gap = mix(mix(vec3(0.961, 0.961, 0.969), lightGap, mix(0.35, 1.0, veil)), darkGap * mix(0.22, 1.0, veil), u_dark);
    gl_FragColor = vec4(gap + grain, 1.0);
    return;
  }

  float la = 2.2 + u_pointer.x * 0.5 + 0.2 * sin(t * 0.12);
  vec3 light = normalize(vec3(cos(la), sin(la) + u_pointer.y * 0.3, 0.8));
  vec3 half_ = normalize(light + vec3(0.0, 0.0, 1.0));

  vec2 bq = (frag - 0.5 * u_resolution) / u_radius;
  float br = length(bq);
  vec2 radial = normalize(bq + 1e-5);
  vec2 around = vec2(-radial.y, radial.x);

  // the height map is 8-bit, so its slope is read across a wide span or the steps show as contour lines
  float step_ = u_bevel * 0.18;
  vec2 grad = vec2(
    dome(frag + vec2(step_, 0.0)) - dome(frag - vec2(step_, 0.0)),
    dome(frag + vec2(0.0, step_)) - dome(frag - vec2(0.0, step_))
  ) / (2.0 * step_);
  vec2 slope = -grad * u_bevel * 1.4;

  // knife pleats fan out from the heart: flat facets with sharp creases, so highlights land as crisp lines
  float warp = noise(radial * 1.6 + vec2(br * 1.4 - t * 0.04, t * 0.02)) * 2.4;
  float phase = (atan(bq.y, bq.x) * PLEATS + warp + br * 3.0) / 6.2831853;
  float periodPx = 6.2831853 * br * u_radius / PLEATS;
  float crease = clamp(periodPx / (1.5 * u_px), 2.0, 400.0);
  float tilt = clamp((fract(phase) - 0.5) * crease, -1.0, 1.0);
  vec3 n = normalize(vec3(slope + around * tilt * 0.34, 1.0));

  // fibres finer than a few pixels would shimmer, so each octave fades out before it gets there
  float ring = 6.2831853 * br * u_radius / u_px;
  float coarse = smoothstep(2.0, 5.0, ring / 160.0);
  float fine = smoothstep(2.0, 5.0, ring / 380.0);
  float fibre = mix(0.5, noise(radial * 160.0 + vec2(0.0, br * 6.0 - t * 0.05)), coarse) * 0.55
    + mix(0.5, noise(radial * 380.0 + vec2(br * 12.0, 0.0)), fine) * 0.45;
  fibre = smoothstep(0.25, 0.85, fibre);
  float th = dot(vec3(radial, 0.0), half_);
  float sheen = pow(sqrt(max(1.0 - th * th, 0.0)), 40.0);
  float nh = max(dot(n, half_), 0.0);
  float spec = pow(nh, 90.0) * 0.9 + pow(nh, 10.0) * 0.18;
  float lit = max(dot(n, light), 0.0);
  float heart = smoothstep(0.5, 0.12, br);

  vec3 satin = vec3(0.12, 0.11, 0.105) * (0.2 + 0.95 * lit);
  satin += CHAMPAGNE * (spec * 0.55 + sheen * 0.1) * (0.45 + 0.55 * fibre);
  satin = mix(satin, satin * vec3(1.7, 0.8, 0.45), heart * 0.75);

  // a crisp lit lip, a few css pixels wide, traced from the exact mask
  float lipW = 2.5 * u_px;
  float inner = min(
    min(cover(frag + vec2(lipW, 0.0)), cover(frag - vec2(lipW, 0.0))),
    min(cover(frag + vec2(0.0, lipW)), cover(frag - vec2(0.0, lipW)))
  );
  float lip = 1.0 - inner;
  float facing = max(dot(normalize(slope + 1e-5), normalize(light.xy)), 0.0);
  satin += CHAMPAGNE * lip * (0.1 + 0.55 * facing);

  vec3 pearl = vec3(0.985, 0.982, 0.978) * (0.8 + 0.2 * lit) + CHAMPAGNE * spec * 0.12 - fibre * 0.015;
  pearl = mix(pearl, pearl * vec3(1.0, 0.88, 0.8), heart * 0.5);
  pearl -= lip * 0.08 * (1.0 - facing);

  vec3 darkCol = mix(darkGap, satin, c) * mix(0.22, 1.0, veil);
  vec3 lightCol = mix(vec3(0.961, 0.961, 0.969), mix(lightGap, pearl, c), mix(0.35, 1.0, veil));
  gl_FragColor = vec4(mix(lightCol, darkCol, u_dark) + grain, 1.0);
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

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const startedAt = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !finePointer.matches) return;
      const box = canvas.getBoundingClientRect();
      pointer.tx = ((event.clientX - box.left) / box.width) * 2 - 1;
      pointer.ty = -(((event.clientY - box.top) / box.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const init = () => {
      const gl = canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
      if (!gl) return null;

      const compiled = createProgram(gl, VERT, FRAG);
      if (!compiled) return null;
      const { program } = compiled;
      gl.useProgram(program);
      const quad = bindFullscreenQuad(gl, program, "a_pos");

      const makeTexture = (unit: number, name: string) => {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(gl.getUniformLocation(program, name), unit);
        return texture;
      };
      const maskTexture = makeTexture(0, "u_mask");
      const heightTexture = makeTexture(1, "u_height");
      const upload = (unit: number, texture: WebGLTexture | null, source: HTMLCanvasElement) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, source);
      };

      const u = (name: string) => gl.getUniformLocation(program, name);
      const uResolution = u("u_resolution");
      const uTime = u("u_time");
      const uDark = u("u_dark");
      const uPointer = u("u_pointer");
      const uVeil = u("u_veil");
      const uRadius = u("u_radius");
      const uBevel = u("u_bevel");
      const uPx = u("u_px");
      const uHeightInfo = u("u_heightInfo");
      const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

      let scale = 1;
      let shown = false;

      const measureVeil = () => {
        const veil = veilRef.current?.getBoundingClientRect();
        if (!veil) return;
        const box = canvas.getBoundingClientRect();
        gl.uniform4f(
          uVeil,
          (veil.left + veil.width / 2 - box.left) * scale,
          (box.bottom - (veil.top + veil.height / 2)) * scale,
          (veil.width / 2) * scale,
          (veil.height / 2) * scale,
        );
      };

      const draw = () => {
        if (gl.isContextLost()) return;
        pointer.x += (pointer.tx - pointer.x) * POINTER_EASE;
        pointer.y += (pointer.ty - pointer.y) * POINTER_EASE;
        gl.uniform1f(uTime, reduceMotion.matches ? 0 : (performance.now() - startedAt) / 1000);
        gl.uniform1f(uDark, darkRef.current);
        gl.uniform2f(uPointer, pointer.x, pointer.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (!shown) {
          shown = true;
          canvas.style.opacity = "1";
        }
      };

      const resize = () => {
        const touch = window.matchMedia("(pointer: coarse)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, touch ? TOUCH_DPR : MAX_DPR);
        const cssW = Math.max(1, canvas.clientWidth);
        const cssH = Math.max(1, canvas.clientHeight);
        scale = dpr * Math.min(
          1,
          Math.sqrt(MAX_PIXELS / (cssW * cssH * dpr * dpr)),
          maxTexture / (cssW * dpr),
          maxTexture / (cssH * dpr),
        );
        const w = Math.max(1, Math.floor(cssW * scale));
        const h = Math.max(1, Math.floor(cssH * scale));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }

        const radius = Math.min(w, h) * GIANT;
        const bevel = radius * BEVEL;
        const maps = buildFlowerMaps(w, h, radius, bevel);
        if (maps) {
          upload(0, maskTexture, maps.mask);
          upload(1, heightTexture, maps.height);
          gl.uniform4f(uHeightInfo, maps.heightPad, maps.heightPad, maps.height.width, maps.height.height);
        }
        gl.uniform2f(uResolution, w, h);
        gl.uniform1f(uRadius, radius);
        gl.uniform1f(uBevel, bevel);
        gl.uniform1f(uPx, scale);
        measureVeil();
        draw();
      };

      let frame = 0;
      let running = false;
      let visible = true;
      const loop = () => {
        draw();
        frame = requestAnimationFrame(loop);
      };
      const sync = () => {
        const shouldRun = visible && !document.hidden && !reduceMotion.matches;
        if (shouldRun && !running) {
          running = true;
          frame = requestAnimationFrame(loop);
        } else if (!shouldRun && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
        if (!running) draw();
      };

      let resizeFrame = 0;
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(resize);
      });
      resizeObserver.observe(canvas);
      if (veilRef.current) resizeObserver.observe(veilRef.current);

      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        sync();
      });
      visibilityObserver.observe(canvas);
      document.addEventListener("visibilitychange", sync);
      reduceMotion.addEventListener("change", sync);

      resize();
      sync();
      redrawRef.current = () => {
        if (!running) draw();
      };

      return () => {
        running = false;
        cancelAnimationFrame(frame);
        cancelAnimationFrame(resizeFrame);
        redrawRef.current = () => {};
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        document.removeEventListener("visibilitychange", sync);
        reduceMotion.removeEventListener("change", sync);
        gl.deleteTexture(maskTexture);
        gl.deleteTexture(heightTexture);
        gl.deleteBuffer(quad);
        compiled.dispose();
      };
    };

    let dispose = init();
    const onLost = (event: Event) => {
      event.preventDefault();
      dispose?.();
      dispose = null;
    };
    const onRestored = () => {
      dispose?.();
      dispose = init();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      dispose?.();
      if (!canvas.isConnected) canvas.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [veilRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className={cn(
        "pointer-events-none absolute inset-0 size-full transition-opacity duration-700 ease-out",
        className,
      )}
    />
  );
}
