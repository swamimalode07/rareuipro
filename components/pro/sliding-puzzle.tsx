"use client";
/* eslint-disable @next/next/no-img-element -- plain img keeps it framework agnostic */

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type SlidingPuzzleProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  grid?: number;
  onReveal?: () => void;
  onImageError?: () => void;
};

const MOVE_MS = 420;
const SHUFFLE_EVERY_MS = 560;
const SETTLE_MS = 350;
const SOLVE_STAGGER_MS = 70;

// neighbours of a slot on the board, in slot indexes
function neighbours(slot: number, n: number) {
  const col = slot % n;
  const row = Math.floor(slot / n);
  const out: number[] = [];
  if (col > 0) out.push(slot - 1);
  if (col < n - 1) out.push(slot + 1);
  if (row > 0) out.push(slot - n);
  if (row < n - 1) out.push(slot + n);
  return out;
}

// slides one tile into the gap, never undoing the previous move
function slide(
  positions: number[],
  n: number,
  last: number,
  random: () => number,
) {
  const empty = positions[n * n - 1];
  const options = neighbours(empty, n)
    .map((slot) => positions.indexOf(slot))
    .filter((tile) => tile !== last);
  const tile = options[Math.floor(random() * options.length)];
  const next = positions.slice();
  next[n * n - 1] = positions[tile];
  next[tile] = empty;
  return { positions: next, moved: tile };
}

// a fixed seed keeps the first render identical on server and client
function scrambled(n: number) {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let positions = Array.from({ length: n * n }, (_, i) => i);
  let last = -1;
  for (let i = 0; i < n * n * 6; i++) {
    ({ positions, moved: last } = slide(positions, n, last, random));
  }
  return { positions, last };
}

function SlidingPuzzle({
  prompt,
  src,
  alt,
  grid = 4,
  onReveal,
  onImageError,
  className,
  ...props
}: SlidingPuzzleProps) {
  const n = Math.min(8, Math.max(2, Math.round(grid)));
  const hidden = n * n - 1;
  const reduceMotion = useReducedMotion();
  const probeRef = React.useRef<HTMLImageElement>(null);
  const revealCallback = React.useRef(onReveal);
  const [board, setBoard] = React.useState(() => ({ n, ...scrambled(n) }));
  const [loadedSrc, setLoadedSrc] = React.useState<string>();
  const [solvedSrc, setSolvedSrc] = React.useState<string>();
  const [revealedSrc, setRevealedSrc] = React.useState<string>();
  const loaded = !!src && loadedSrc === src;
  const solving = !!src && solvedSrc === src;
  const revealed = !!src && revealedSrc === src;
  // a grid change rebuilds the board
  const positions = board.n === n ? board.positions : scrambled(n).positions;
  const lastSolveDelay = (n * n - 2) * SOLVE_STAGGER_MS;

  React.useEffect(() => {
    revealCallback.current = onReveal;
  });

  // a cached image can finish loading before hydration, when onLoad never fires
  React.useEffect(() => {
    const probe = probeRef.current;
    if (src && probe?.complete && probe.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  React.useEffect(() => {
    if (loaded || reduceMotion) return;
    const timer = window.setInterval(() => {
      setBoard((prev) => {
        const base = prev.n === n ? prev : { n, ...scrambled(n) };
        const next = slide(base.positions, n, base.last, Math.random);
        return { n, positions: next.positions, last: next.moved };
      });
    }, SHUFFLE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [loaded, reduceMotion, n]);

  React.useEffect(() => {
    if (!loaded || !src) return;
    const solve = window.setTimeout(
      () => setSolvedSrc(src),
      reduceMotion ? 0 : SETTLE_MS,
    );
    const done = window.setTimeout(
      () => {
        setRevealedSrc(src);
        revealCallback.current?.();
      },
      reduceMotion ? 400 : SETTLE_MS + lastSolveDelay + MOVE_MS + 450,
    );
    return () => {
      window.clearTimeout(solve);
      window.clearTimeout(done);
    };
  }, [loaded, src, reduceMotion, lastSolveDelay]);

  return (
    <div
      data-slot="sliding-puzzle"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn(
        "relative aspect-square w-80 overflow-hidden rounded-[22px] bg-neutral-100 dark:bg-[#161618]",
        className,
      )}
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

      {positions.map((slot, tile) => {
        const target = solving ? tile : slot;
        const isGap = tile === hidden;
        return (
          <div
            key={tile}
            className={cn(
              "absolute top-0 left-0 p-[2px] transition-[transform,opacity] ease-[cubic-bezier(0.3,0.7,0.2,1)] motion-reduce:transition-none",
              isGap && !revealed && "opacity-0",
            )}
            style={{
              width: `${100 / n}%`,
              height: `${100 / n}%`,
              transform: `translate(${(target % n) * 100}%, ${Math.floor(target / n) * 100}%)`,
              transitionDuration: `${MOVE_MS}ms`,
              transitionDelay: solving ? `${tile * SOLVE_STAGGER_MS}ms` : "0ms",
            }}
          >
            <div className="relative size-full overflow-hidden rounded-[8px] bg-neutral-200/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.06)] dark:bg-[#242426] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)]">
              {src && (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className={cn(
                    "absolute max-w-none object-cover transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    width: `${n * 100}%`,
                    height: `${n * 100}%`,
                    left: `${-(tile % n) * 100}%`,
                    top: `${-Math.floor(tile / n) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {src && (
        // the solved picture is shown as one piece so no seams remain between tiles
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            revealed ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />
      )}
    </div>
  );
}

export { SlidingPuzzle, type SlidingPuzzleProps };
export default SlidingPuzzle;
