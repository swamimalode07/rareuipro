"use client";
/* eslint-disable @next/next/no-img-element -- plain img keeps it framework agnostic */

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type LedWallProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  onReveal?: () => void;
  onImageError?: () => void;
};

type Led = { x: number; y: number; d: number; color: [number, number, number] };

const OFF: [number, number, number] = [30, 30, 33];
const SCAN: [number, number, number] = [74, 74, 80];
const LIGHT_MS = 1300;
const PHOTO_AT = 1500;
const DONE_AT = 2200;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

function LedWall({
  prompt,
  src,
  alt,
  onReveal,
  onImageError,
  className,
  ...props
}: LedWallProps) {
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
    // the scan keeps running, so the caller can retry with a new src
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

    const step = Math.max(6, width / 30);
    const radius = step * 0.38;
    const reach = Math.hypot(width, height) / 2;
    const leds: Led[] = [];
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        const d = Math.hypot(x - width / 2, y - height / 2) / reach;
        leds.push({ x, y, d, color: OFF });
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
      for (const led of leds) {
        const k = (Math.floor(led.y) * pixels.width + Math.floor(led.x)) * 4;
        led.color = [pixels.data[k], pixels.data[k + 1], pixels.data[k + 2]];
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
      // a soft ring keeps sweeping outward while the image generates
      const ring = reduceMotion ? -1 : (((now - start) / 1000) * 0.55) % 1.6;
      for (const led of leds) {
        const scan = ring < 0 ? 0 : Math.exp(-(((led.d - ring) / 0.12) ** 2));
        const idle: [number, number, number] = [
          lerp(OFF[0], SCAN[0], scan),
          lerp(OFF[1], SCAN[1], scan),
          lerp(OFF[2], SCAN[2], scan),
        ];
        const on = revealStart ? clamp((since / LIGHT_MS - led.d) * 3) : 0;
        ctx.fillStyle = `rgb(${Math.round(lerp(idle[0], led.color[0], on))},${Math.round(lerp(idle[1], led.color[1], on))},${Math.round(lerp(idle[2], led.color[2], on))})`;
        ctx.beginPath();
        ctx.arc(led.x, led.y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (on > 0.5) {
          ctx.globalAlpha = 0.28 * on;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(
            led.x - radius * 0.3,
            led.y - radius * 0.32,
            radius * 0.32,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
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
      data-slot="led-wall"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn(
        "relative aspect-square w-80 overflow-hidden rounded-[22px] bg-[#0E0E0F] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.3)]",
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

export { LedWall, type LedWallProps };
export default LedWall;
