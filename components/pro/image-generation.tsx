"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type ImageGenerationProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  onReveal?: () => void;
  onImageError?: () => void;
};

type Word = { text: string; x: number; y: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  driftX: number;
  driftY: number;
  word: number;
  seed: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: [number, number, number];
  delay: number;
};

const PARTICLES = 1600;
const INTRO_MS = 500;
const HOLD_MS = 900;
const WORD_GAP_MS = 140;
const DISSOLVE_MS = 1600;
const MIN_DREAM_MS = 700;
const GATHER_MS = 1000;
const SHARPEN_AT = 450;
const FADE_OUT_AT = 1050;
const DONE_AT = 1600;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// css colours can be oklch, so let the browser resolve them by painting one pixel
function resolveColor(value: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return [128, 128, 128];
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

type Layout = { words: Word[]; font: string };

function wrap(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxWidth: number,
) {
  const space = ctx.measureText(" ").width;
  const lines: { text: string; width: number }[][] = [[]];
  let lineWidth = 0;
  for (const text of words) {
    const w = ctx.measureText(text).width;
    const line = lines[lines.length - 1];
    if (line.length && lineWidth + space + w > maxWidth) {
      lines.push([{ text, width: w }]);
      lineWidth = w;
    } else {
      lineWidth += (line.length ? space : 0) + w;
      line.push({ text, width: w });
    }
  }
  return { lines, space };
}

// wraps the prompt into centred lines, shrinking the type until it fits the frame
function layoutWords(
  ctx: CanvasRenderingContext2D,
  prompt: string,
  family: string,
  width: number,
  height: number,
): Layout {
  const texts = prompt.trim().split(/\s+/).filter(Boolean);
  let size = Math.min(28, Math.max(16, width * 0.065));
  let font = "";
  let wrapped: ReturnType<typeof wrap>;
  do {
    font = `600 ${size}px ${family}`;
    ctx.font = font;
    wrapped = wrap(ctx, texts, width * 0.78);
    size -= 1;
  } while (size >= 10 && wrapped.lines.length * size * 1.3 > height * 0.8);

  const fontSize = size + 1;
  const lineHeight = fontSize * 1.3;
  const top = (height - wrapped.lines.length * lineHeight) / 2 + fontSize;
  const words: Word[] = [];
  wrapped.lines.forEach((line, row) => {
    const total =
      line.reduce((sum, w) => sum + w.width, 0) +
      wrapped.space * (line.length - 1);
    let x = (width - total) / 2;
    for (const w of line) {
      words.push({ text: w.text, x, y: top + row * lineHeight });
      x += w.width + wrapped.space;
    }
  });
  return { words, font };
}

// paints each word in its own red value so every sampled pixel knows its word
function sampleWords(
  words: Word[],
  font: string,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.font = font;
  words.forEach((word, i) => {
    ctx.fillStyle = `rgb(${Math.min(i, 254) + 1},0,0)`;
    ctx.fillText(word.text, word.x, word.y);
  });
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const points: { x: number; y: number; word: number }[] = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const k = (y * canvas.width + x) * 4;
      if (data[k + 3] > 200) points.push({ x, y, word: data[k] - 1 });
    }
  }
  return points;
}

// reads the image's colours at the canvas size, cropped like object-cover
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
    // a cross-origin image without cors headers can't be read; specks keep the text colour
    return null;
  }
}

function ImageGeneration({
  prompt,
  src,
  alt,
  onReveal,
  onImageError,
  className,
  ...props
}: ImageGenerationProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const loaded = React.useRef<HTMLImageElement | null>(null);
  const callbacks = React.useRef({ onReveal, onImageError });
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const doneFor = React.useRef<string | null>(null);
  const [stage, setStage] = React.useState<{
    prompt: string;
    done: boolean;
  } | null>(null);
  const sharpening = stage?.prompt === prompt;
  const revealed = sharpening && stage.done;

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
    loaded.current = null;
    if (!src) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      loaded.current = image;
    };
    // the dust keeps drifting, so the caller can retry with a new src
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
    if (doneFor.current === prompt) return;

    let cancelled = false;
    let raf = 0;
    let visible = true;
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    watcher.observe(root);

    const run = () => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const style = getComputedStyle(root);
      const ink = resolveColor(style.color);
      const { words, font } = layoutWords(
        ctx,
        prompt,
        style.fontFamily,
        width,
        height,
      );
      const points = sampleWords(words, font, width, height);

      const particles: Particle[] = Array.from({ length: PARTICLES }, () => {
        const p = points.length
          ? points[Math.floor(Math.random() * points.length)]
          : { x: Math.random() * width, y: Math.random() * height, word: 0 };
        return {
          x: p.x + (Math.random() - 0.5) * 1.5,
          y: p.y + (Math.random() - 0.5) * 1.5,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60 - 20,
          driftX: Math.random() * width,
          driftY: Math.random() * height,
          word: p.word,
          seed: Math.random() * Math.PI * 2,
          fromX: 0,
          fromY: 0,
          toX: 0,
          toY: 0,
          color: ink,
          delay: Math.random() * 400,
        };
      });

      // long prompts dissolve faster so the dust always arrives in about the same time
      const gap = Math.min(
        WORD_GAP_MS,
        DISSOLVE_MS / Math.max(words.length, 1),
      );
      const releaseAt = (word: number) => INTRO_MS + HOLD_MS + word * gap;
      const lastRelease = releaseAt(Math.max(words.length - 1, 0));
      let start = 0;
      let last = 0;
      let revealStart = 0;
      let sharpened = false;

      const beginReveal = (now: number, image: HTMLImageElement) => {
        revealStart = now;
        const pixels = sampleImage(image, width, height);
        for (const p of particles) {
          p.fromX = p.x;
          p.fromY = p.y;
          p.toX = Math.random() * width;
          p.toY = Math.random() * height;
          if (pixels) {
            const k =
              (Math.floor(p.toY) * pixels.width + Math.floor(p.toX)) * 4;
            p.color = [pixels.data[k], pixels.data[k + 1], pixels.data[k + 2]];
          }
        }
      };

      const finish = () => {
        ctx.clearRect(0, 0, width, height);
        doneFor.current = prompt;
        setStage({ prompt, done: true });
        callbacks.current.onReveal?.();
      };

      const drawWords = (elapsed: number) => {
        ctx.font = font;
        words.forEach((word, i) => {
          const shown = clamp((elapsed - i * 60) / INTRO_MS);
          const gone = reduceMotion ? 0 : clamp((elapsed - releaseAt(i)) / 250);
          const alpha = shown * (1 - gone);
          if (alpha <= 0) return;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${ink.join(",")})`;
          ctx.fillText(word.text, word.x, word.y + (1 - shown) * 6);
        });
        ctx.globalAlpha = 1;
      };

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        if (!start) start = last = now;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const elapsed = now - start;
        const image = loaded.current;
        if (!visible) return;

        if (reduceMotion) {
          ctx.clearRect(0, 0, width, height);
          if (image) {
            cancelAnimationFrame(raf);
            finish();
            return;
          }
          drawWords(INTRO_MS * 2);
          return;
        }

        if (!revealStart && image && elapsed > lastRelease + MIN_DREAM_MS) {
          beginReveal(now, image);
        }

        ctx.clearRect(0, 0, width, height);
        drawWords(elapsed);

        if (revealStart) {
          const since = now - revealStart;
          if (!sharpened && since > SHARPEN_AT) {
            sharpened = true;
            setStage({ prompt, done: false });
          }
          if (since > DONE_AT) {
            cancelAnimationFrame(raf);
            finish();
            return;
          }
          const fade =
            1 - clamp((since - FADE_OUT_AT) / (DONE_AT - FADE_OUT_AT));
          for (const p of particles) {
            const t = ease(clamp((since - p.delay) / GATHER_MS));
            p.x = lerp(p.fromX, p.toX, t);
            p.y = lerp(p.fromY, p.toY, t);
            const [r, g, b] = p.color;
            ctx.globalAlpha = 0.75 * fade;
            ctx.fillStyle = `rgb(${Math.round(lerp(ink[0], r, t))},${Math.round(lerp(ink[1], g, t))},${Math.round(lerp(ink[2], b, t))})`;
            const s = lerp(1.4, 2.6, t);
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
          }
          ctx.globalAlpha = 1;
          return;
        }

        // released specks burst off the word, then settle around their own spot,
        // which wanders on a slow flow field so the dust keeps moving
        const time = elapsed / 1000;
        const pull = 1 - Math.exp(-dt * 1.4);
        ctx.fillStyle = `rgb(${ink.join(",")})`;
        for (const p of particles) {
          const age = elapsed - releaseAt(p.word);
          if (age < 0) continue;
          const angle =
            Math.sin(p.driftX * 0.012 + time * 0.3 + p.seed) * 2 +
            Math.cos(p.driftY * 0.014 - time * 0.25) * 2;
          p.driftX = Math.min(
            width,
            Math.max(0, p.driftX + Math.cos(angle) * 14 * dt),
          );
          p.driftY = Math.min(
            height,
            Math.max(0, p.driftY + Math.sin(angle) * 14 * dt),
          );
          p.vx *= 0.94;
          p.vy *= 0.94;
          const settle = pull * clamp(age / 500);
          p.x += p.vx * dt + (p.driftX - p.x) * settle;
          p.y += p.vy * dt + (p.driftY - p.y) * settle;
          const twinkle = 0.55 + 0.45 * Math.sin(time * 2 + p.seed * 3);
          ctx.globalAlpha = 0.7 * twinkle * clamp(age / 250);
          ctx.fillRect(p.x - 0.7, p.y - 0.7, 1.4, 1.4);
        }
        ctx.globalAlpha = 1;
      };

      raf = requestAnimationFrame(tick);
    };

    // canvas text only uses a web font once it has loaded, so wait for it first
    const family = getComputedStyle(root).fontFamily;
    Promise.resolve(document.fonts?.load(`600 20px ${family}`))
      .catch(() => {})
      .then(run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      watcher.disconnect();
    };
  }, [prompt, size, reduceMotion]);

  return (
    <div
      ref={rootRef}
      data-slot="image-generation"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn(
        "relative aspect-square w-80 overflow-hidden rounded-[22px] bg-neutral-100 font-runde text-neutral-800 shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.035),0_2px_4px_-2px_rgb(0_0_0/0.025)] dark:bg-[#1C1C1E] dark:text-neutral-100 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.5)]",
        className,
      )}
      {...props}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "absolute inset-0 size-full object-cover transition-[opacity,filter] duration-[900ms] ease-out motion-reduce:transition-opacity",
            sharpening ? "opacity-100 blur-0" : "opacity-0 blur-[14px]",
          )}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("absolute inset-0 size-full", revealed && "hidden")}
      />
    </div>
  );
}

export { ImageGeneration, type ImageGenerationProps };
export default ImageGeneration;
