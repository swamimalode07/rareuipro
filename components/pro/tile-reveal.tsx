"use client";
/* eslint-disable @next/next/no-img-element -- plain img keeps it framework agnostic */

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type TileRevealProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  columns?: number;
  rows?: number;
  onReveal?: () => void;
  onImageError?: () => void;
};

const FLIP_MS = 700;
const STAGGER_MS = 45;

function TileReveal({
  prompt,
  src,
  alt,
  columns: columnsProp = 8,
  rows: rowsProp = columnsProp,
  onReveal,
  onImageError,
  className,
  ...props
}: TileRevealProps) {
  const columns = Math.max(1, Math.round(columnsProp));
  const rows = Math.max(1, Math.round(rowsProp));
  const reduceMotion = useReducedMotion();
  const probeRef = React.useRef<HTMLImageElement>(null);
  const revealCallback = React.useRef(onReveal);
  const [loadedSrc, setLoadedSrc] = React.useState<string>();
  const [revealedSrc, setRevealedSrc] = React.useState<string>();
  const flipped = !!src && loadedSrc === src;
  const revealed = !!src && revealedSrc === src;
  const lastDelay = (columns - 1 + rows - 1) * STAGGER_MS;

  React.useEffect(() => {
    revealCallback.current = onReveal;
  });

  // a cached image can finish loading before hydration, when onLoad never fires
  React.useEffect(() => {
    const probe = probeRef.current;
    if (src && probe?.complete && probe.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  React.useEffect(() => {
    if (!flipped || !src) return;
    const timer = window.setTimeout(
      () => {
        setRevealedSrc(src);
        revealCallback.current?.();
      },
      reduceMotion ? 400 : lastDelay + FLIP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [flipped, src, reduceMotion, lastDelay]);

  return (
    <div
      data-slot="tile-reveal"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn(
        "relative grid aspect-square w-80 overflow-hidden rounded-[22px] bg-neutral-100 [perspective:900px] dark:bg-[#161618]",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      {...props}
    >
      {src && (
        <img
          ref={probeRef}
          src={src}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoadedSrc(src)}
          onError={() => onImageError?.()}
          className="hidden"
        />
      )}

      {Array.from({ length: columns * rows }, (_, i) => {
        const column = i % columns;
        const row = Math.floor(i / columns);
        const delay = (column + row) * STAGGER_MS;
        return (
          <div
            key={i}
            className="relative [transform-style:preserve-3d] transition-transform ease-[cubic-bezier(0.3,0.7,0.2,1)] motion-reduce:transition-none"
            style={{
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transitionDuration: `${FLIP_MS}ms`,
              transitionDelay: flipped ? `${delay}ms` : "0ms",
            }}
          >
            <div className="absolute inset-[1.5px] overflow-hidden rounded-[5px] bg-neutral-200/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] [backface-visibility:hidden] dark:bg-[#232325] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
              {!reduceMotion && (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 bg-white dark:bg-white/[0.13]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.6,
                    delay: (column + row) * 0.09,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>

            {src && (
              <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute max-w-none object-cover"
                  style={{
                    width: `${columns * 100}%`,
                    height: `${rows * 100}%`,
                    left: `${-column * 100}%`,
                    top: `${-row * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {revealed && (
        // tiles can leave hairline seams at fractional sizes, so the finished image is one piece
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

export { TileReveal, type TileRevealProps };
export default TileReveal;
