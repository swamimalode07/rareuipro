"use client";
/* eslint-disable @next/next/no-img-element -- plain img keeps it framework agnostic */

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type HalftoneRevealProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  onReveal?: () => void;
  onImageError?: () => void;
};

type Dot = {
  x: number;
  y: number;
  delay: number;
  color: [number, number, number];
  radius: number;
};

const DOT_MS = 800;
const SWEEP_MS = 600;
const PHOTO_AT = 1100;
const DONE_AT = 1900;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// css colours can be oklch, so let the browser resolve them by painting one pixel
function resolveColor(value: string): [number, number, number] {
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!ctx) return [128, 128, 128];
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

// reads the image's colours at the box size, cropped like object-cover
function sampleImage(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    // a cross-origin image without cors headers can't be read; the photo just fades in
    return null;
  }
}

function HalftoneReveal({
  prompt,
  src,
  alt,
  onReveal,
  onImageError,
  className,
  ...props
}: HalftoneRevealProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const loaded = React.useRef<{ src: string; image: HTMLImageElement }>(null);
  const doneFor = React.useRef<string>(null);
  const callbacks = React.useRef({ onReveal, onImageError });
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [photoSrc, setPhotoSrc] = React.useState<string>();
  const [revealedSrc, setRevealedSrc] = React.useState<string>();
  const revealed = !!src && revealedSrc === src;

  React.useEffect(() => {
    callbacks.current = { onReveal, onImageError };
  });

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
          ? prev
          : { width, height },
      );
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      loaded.current = { src, image };
    };
    // the dots keep rippling, so the caller can retry with a new src
    image.onerror = () => callbacks.current.onImageError?.();
    image.src = src;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const { width, height } = size;
    if (!root || !canvas || !ctx || !width || !height) return;
    if (src && doneFor.current === src) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ink = resolveColor(getComputedStyle(root).color);
    const step = Math.max(7, width / 34);
    const cx = width / 2;
    const cy = height / 2;
    const dots: Dot[] = [];
    for (
      let row = 0, y = step / 2;
      y < height + step;
      row++, y += step * 0.87
    ) {
      // alternate rows shift half a step, like a printed halftone screen
      for (let x = (row % 2) * (step / 2); x < width + step; x += step) {
        dots.push({
          x,
          y,
          delay: ((x + y) / (width + height)) * SWEEP_MS,
          color: ink,
          radius: step * 0.15,
        });
      }
    }

    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(root);

    let raf = 0;
    let start = 0;
    let revealStart = 0;
    let photoShown = false;

    const beginReveal = (now: number, image: HTMLImageElement) => {
      revealStart = now;
      const pixels = sampleImage(image, width, height);
      if (!pixels) return;
      for (const dot of dots) {
        const px = Math.min(pixels.width - 1, Math.max(0, Math.floor(dot.x)));
        const py = Math.min(pixels.height - 1, Math.max(0, Math.floor(dot.y)));
        const k = (py * pixels.width + px) * 4;
        dot.color = [pixels.data[k], pixels.data[k + 1], pixels.data[k + 2]];
        const light = (dot.color[0] + dot.color[1] + dot.color[2]) / 765;
        // darker areas print bigger dots
        dot.radius = step * 0.62 * (1.2 - light * 0.6);
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!start) start = now;
      if (!visible) return;
      const current = loaded.current;
      const image = current && current.src === src ? current.image : null;

      if (!revealStart && image) beginReveal(now, image);
      const since = revealStart ? now - revealStart : -1;

      if (revealStart && (reduceMotion || since > PHOTO_AT) && !photoShown) {
        photoShown = true;
        setPhotoSrc(src);
      }
      if (revealStart && (reduceMotion ? since > 400 : since > DONE_AT)) {
        cancelAnimationFrame(raf);
        doneFor.current = src ?? null;
        setRevealedSrc(src);
        callbacks.current.onReveal?.();
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const time = (now - start) / 1000;
      for (const dot of dots) {
        const d = Math.hypot(dot.x - cx, dot.y - cy);
        const ripple = reduceMotion
          ? 0.5
          : 0.5 + 0.5 * Math.sin(time * 2.2 - d * 0.045);
        const idle = step * (0.1 + 0.08 * ripple);
        const t = revealStart ? clamp((since - dot.delay) / DOT_MS) : 0;
        const [r, g, b] = dot.color;
        ctx.globalAlpha = lerp(0.18 + 0.2 * ripple, 1, t);
        ctx.fillStyle = `rgb(${Math.round(lerp(ink[0], r, t))},${Math.round(lerp(ink[1], g, t))},${Math.round(lerp(ink[2], b, t))})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, lerp(idle, dot.radius, t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      watcher.disconnect();
    };
  }, [src, size, reduceMotion]);

  return (
    <div
      ref={rootRef}
      data-slot="halftone-reveal"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn(
        "relative aspect-square w-80 overflow-hidden rounded-[22px] bg-[#F4F1EA] text-neutral-800 shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.035),0_2px_4px_-2px_rgb(0_0_0/0.025)] dark:bg-[#1C1C1E] dark:text-neutral-200 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.5)]",
        className,
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("absolute inset-0 size-full", revealed && "hidden")}
      />
      {src && (
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
            photoSrc === src ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}

export { HalftoneReveal, type HalftoneRevealProps };
export default HalftoneReveal;
