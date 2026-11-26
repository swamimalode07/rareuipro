"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

type Corner = [x: number, y: number, radius: number];

// squircle corners as cubics: the curve starts 1.6r from the vertex with its handles pulled in, so it works in every browser unlike corner-shape
function squircle(points: Corner[], sx = 1, sy = 1) {
  const f = (x: number, y: number) =>
    `${+(x * sx).toFixed(4)} ${+(y * sy).toFixed(4)}`;
  const n = points.length;
  let d = "";
  points.forEach(([x, y, r], i) => {
    const [px, py] = points[(i - 1 + n) % n];
    const [nx, ny] = points[(i + 1) % n];
    const inLen = Math.hypot(px - x, py - y);
    const outLen = Math.hypot(nx - x, ny - y);
    const l = Math.min(r * 1.6, inLen / 2, outLen / 2);
    const ax = (px - x) / inLen;
    const ay = (py - y) / inLen;
    const bx = (nx - x) / outLen;
    const by = (ny - y) / outLen;
    d += `${i === 0 ? "M" : "L"}${f(x + ax * l, y + ay * l)}`;
    d += `C${f(x + ax * l * 0.17, y + ay * l * 0.17)} ${f(x + bx * l * 0.17, y + by * l * 0.17)} ${f(x + bx * l, y + by * l)}`;
  });
  return `${d}Z`;
}

function rect(w: number, h: number, r: number, x = 0, y = 0): Corner[] {
  return [
    [x, y, r],
    [x + w, y, r],
    [x + w, y + h, r],
    [x, y + h, r],
  ];
}

const BACK = squircle(rect(200, 178, 28, 0, 12));
const FRONT = squircle([
  [0, 34, 26],
  [84, 34, 12],
  [104, 54, 12],
  [200, 54, 26],
  [200, 190, 30],
  [0, 190, 30],
]);
const CARD = squircle(rect(80, 100, 18));
// the card's inner window in its own 0 to 1 box, for a clip-path that scales with the card
const CARD_WINDOW = squircle(rect(66, 86, 12), 1 / 66, 1 / 86);

// a pressed-in pill: shaded at the top inside, lit along the bottom edge
const chipStyle = {
  background: "color-mix(in oklab, var(--folder) 22%, white)",
  borderColor: "color-mix(in oklab, var(--folder) 45%, white)",
  color: "color-mix(in oklab, var(--folder) 40%, #555)",
} as const;

const cardSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 19,
  mass: 0.9,
};
const flapSpring: Transition = { type: "spring", stiffness: 380, damping: 30 };
const tiltSpring = { stiffness: 200, damping: 20 };
const instant: Transition = { duration: 0 };
const STAGGER = 0.035;
const MAX_TILT = 8;
// the front leans toward the viewer from its bottom edge, and folds further when open
const REST_TILT = -10;
const OPEN_TILT = -32;

type FolderProps = React.ComponentProps<"div"> & {
  color?: string;
  items?: React.ReactNode[];
  label?: string;
  caption?: string;
  count?: number;
  countLabel?: string;
  open?: boolean;
};

function Folder({
  color = "#8C9BFF",
  items = [],
  label,
  caption,
  count,
  countLabel,
  open,
  className,
  style,
  children,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerUp,
  onFocus,
  onBlur,
  ...props
}: FolderProps) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = React.useState(false);
  const isOpen = open ?? active;
  const tiltX = useSpring(0, tiltSpring);
  const tiltY = useSpring(0, tiltSpring);
  const maxSpread = (items.length - 1) / 2;
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const handleEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(event);
    if (event.pointerType === "mouse") setActive(true);
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - box.left) / box.width - 0.5) * MAX_TILT * 2);
    tiltX.set(-((event.clientY - box.top) / box.height - 0.5) * MAX_TILT);
  };

  const handleLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    tiltX.set(0);
    tiltY.set(0);
    if (event.pointerType === "mouse") setActive(false);
  };

  // touch has no hover, so a tap toggles instead
  const handleUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event);
    if (event.pointerType !== "mouse") setActive((value) => !value);
  };

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    setActive(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
  };

  return (
    <div
      data-slot="folder"
      data-state={isOpen ? "open" : "closed"}
      onPointerEnter={handleEnter}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerUp={handleUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={{ "--folder": color, ...style } as React.CSSProperties}
      className={cn(
        "relative flex w-64 select-none flex-col items-center gap-5",
        className,
      )}
      {...props}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute size-0">
        <clipPath id={`${id}-window`} clipPathUnits="objectBoundingBox">
          <path d={CARD_WINDOW} />
        </clipPath>
      </svg>

      <div className="relative aspect-[200/190] w-full [perspective:900px]">
        <motion.div
          style={{ rotateX: tiltX, rotateY: tiltY }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={flapSpring}
          className="absolute inset-0 [perspective:600px] [perspective-origin:50%_0%]"
        >
          <svg
            viewBox="0 0 200 190"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <clipPath id={`${id}-back`}>
                <path d={BACK} />
              </clipPath>
              <filter
                id={`${id}-blur`}
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <path
              d={BACK}
              style={{ fill: "color-mix(in oklab, var(--folder) 86%, black)" }}
            />
            <g clipPath={`url(#${id}-back)`}>
              <path
                d={BACK}
                fill="none"
                strokeWidth="14"
                filter={`url(#${id}-blur)`}
                style={{
                  stroke: "color-mix(in oklab, var(--folder) 60%, white)",
                  strokeOpacity: 0.45,
                }}
              />
            </g>
            <path
              d={BACK}
              fill="none"
              strokeWidth="1"
              style={{
                stroke: "color-mix(in oklab, var(--folder) 70%, black)",
                strokeOpacity: 0.5,
              }}
            />
          </svg>

          {items.map((item, i) => {
            const offset = i - (items.length - 1) / 2;
            const spread = Math.abs(offset);
            return (
              <motion.div
                key={i}
                initial={false}
                animate={
                  isOpen
                    ? {
                        x: `${offset * 112}%`,
                        y: `${-58 + spread * 24}%`,
                        rotate: offset * 15,
                      }
                    : {
                        x: `${offset * 42}%`,
                        y: `${22 + spread * 2}%`,
                        rotate: offset * 7,
                      }
                }
                // cards leave from the middle outward and return from the edges inward
                transition={
                  reduceMotion
                    ? instant
                    : {
                        ...cardSpring,
                        delay: (isOpen ? spread : maxSpread - spread) * STAGGER,
                      }
                }
                style={{ zIndex: items.length - Math.ceil(spread) }}
                className="absolute left-1/2 top-[6%] aspect-[4/5] w-[36%] -translate-x-1/2 [filter:drop-shadow(0_3px_6px_rgb(0_0_0/0.12))]"
              >
                <svg
                  viewBox="0 0 80 100"
                  aria-hidden="true"
                  className="absolute inset-0 size-full"
                >
                  <path
                    d={CARD}
                    fill="white"
                    stroke="black"
                    strokeOpacity="0.08"
                    strokeWidth="1"
                  />
                </svg>
                <div
                  className="absolute left-[8.75%] top-[7%] h-[86%] w-[82.5%] bg-neutral-100 shadow-[inset_0_1px_3px_rgb(0_0_0/0.12)] [&>*]:size-full"
                  style={{
                    clipPath: `url(#${id}-window)`,
                    WebkitClipPath: `url(#${id}-window)`,
                  }}
                >
                  {item}
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={false}
            animate={{ rotateX: isOpen ? OPEN_TILT : REST_TILT }}
            transition={reduceMotion ? instant : flapSpring}
            style={{ transformOrigin: "50% 100%" }}
            className="absolute inset-0 z-10 [filter:drop-shadow(0_1px_1px_rgb(0_0_0/0.1))_drop-shadow(0_12px_18px_rgb(0_0_0/0.18))]"
          >
            <svg
              viewBox="0 0 200 190"
              aria-hidden="true"
              className="absolute inset-0 size-full"
            >
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0"
                    style={{
                      stopColor:
                        "color-mix(in oklab, var(--folder) 70%, white)",
                    }}
                  />
                  <stop offset="1" style={{ stopColor: "var(--folder)" }} />
                </linearGradient>
                <filter
                  id={`${id}-soften`}
                  x="-10%"
                  y="-10%"
                  width="120%"
                  height="120%"
                >
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <clipPath id={`${id}-front`}>
                  <path d={FRONT} />
                </clipPath>
              </defs>
              <path d={FRONT} fill={`url(#${id}-fill)`} />
              <g clipPath={`url(#${id}-front)`}>
                <path
                  d={FRONT}
                  fill="none"
                  strokeWidth="20"
                  filter={`url(#${id}-soften)`}
                  style={{
                    stroke: "color-mix(in oklab, var(--folder) 55%, white)",
                    strokeOpacity: 0.5,
                  }}
                />
              </g>
              <path
                d={FRONT}
                fill="none"
                strokeWidth="1.5"
                style={{
                  stroke: "color-mix(in oklab, var(--folder) 92%, black)",
                }}
              />
            </svg>
            {children != null && (
              <div className="absolute inset-x-0 bottom-0 top-[30%] flex items-center justify-center">
                {children}
              </div>
            )}
            {count !== undefined && (
              <div className="pointer-events-none absolute inset-0 [container-type:inline-size]">
                <span
                  className="absolute bottom-[7cqw] left-[7cqw] flex h-[17cqw] min-w-[17cqw] items-center justify-center gap-[2cqw] rounded-full border px-[5cqw] font-runde text-[7cqw] font-semibold tabular-nums shadow-[inset_0_2px_4px_rgb(0_0_0/0.1),inset_0_-1px_0_rgb(255_255_255/0.7)]"
                  style={chipStyle}
                >
                  {count}
                  {countLabel && (
                    <span className="opacity-70">{countLabel}</span>
                  )}
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {(label || caption) && (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {label && (
            <span className="font-runde text-lg font-semibold tracking-tight">
              {label}
            </span>
          )}
          {caption && (
            <span className="text-sm font-medium tabular-nums opacity-50">
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { Folder };
export default Folder;
