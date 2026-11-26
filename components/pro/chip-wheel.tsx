"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

type ChipWheelItem = {
  label: string;
  icon?: React.ReactNode;
  color?: string;
};

type ChipWheelProps = Omit<React.ComponentProps<"span">, "children"> & {
  items: ChipWheelItem[];
  interval?: number;
  paused?: boolean;
};

// underdamped, so the drum overshoots a touch and clicks back into place like a detent
const spin = { stiffness: 150, damping: 17, mass: 1 };
// the chips sit on a cylinder of this radius (in chip ems), one step apart
const RADIUS = 3.4;
const STEP = 44;
// one extra slot on each side stays mounted but out of view, so chips enter and leave without a pop
const REACH = 3;

const chipClass =
  "inline-flex h-[2.1em] items-center gap-[0.4em] whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--chip)_13%,transparent)] pl-[0.3em] pr-[0.8em] text-[0.56em] font-semibold tracking-[-0.01em] text-[color-mix(in_oklab,var(--chip)_82%,black)] dark:bg-[color-mix(in_oklab,var(--chip)_18%,transparent)] dark:text-[color-mix(in_oklab,var(--chip)_65%,white)]";

function chipColor(item: ChipWheelItem) {
  return { "--chip": item.color ?? "#737373" } as React.CSSProperties;
}

function ChipFace({ item }: { item: ChipWheelItem }) {
  return (
    <>
      {item.icon && (
        <span className="flex size-[1.5em] shrink-0 items-center justify-center rounded-full bg-[var(--chip)] text-white [&>svg]:size-[0.85em]">
          {item.icon}
        </span>
      )}
      {item.label}
    </>
  );
}

function WheelChip({
  index,
  position,
  item,
}: {
  index: number;
  position: MotionValue<number>;
  item: ChipWheelItem;
}) {
  const transform = useTransform(position, (p) => {
    const angle = (index - p) * STEP;
    return `translate(-50%, -50%) translateZ(-${RADIUS}em) rotateX(${-angle}deg) translateZ(${RADIUS}em)`;
  });
  const opacity = useTransform(position, (p) => {
    const angle = Math.abs(index - p) * STEP;
    return angle >= 90 ? 0 : Math.cos((angle * Math.PI) / 180) ** 1.6;
  });

  return (
    <motion.span
      className={cn(
        chipClass,
        "absolute left-1/2 top-1/2 [backface-visibility:hidden]",
      )}
      style={{ ...chipColor(item), transform, opacity }}
    >
      <ChipFace item={item} />
    </motion.span>
  );
}

function ChipWheel({
  items,
  interval = 2200,
  paused = false,
  className,
  onPointerEnter,
  onPointerLeave,
  ...props
}: ChipWheelProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [step, setStep] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const count = items.length;
  const position = useSpring(0, spin);

  React.useEffect(() => {
    if (reduceMotion) position.jump(step);
    else position.set(step);
  }, [step, reduceMotion, position]);

  React.useEffect(() => {
    if (paused || hovered || count < 2) return;
    const timer = window.setInterval(() => setStep((s) => s + 1), interval);
    return () => window.clearInterval(timer);
  }, [paused, hovered, count, interval]);

  if (count === 0) return null;

  const at = (k: number) => items[((k % count) + count) % count];
  const slots = Array.from(
    { length: REACH * 2 + 1 },
    (_, i) => step - REACH + i,
  );

  return (
    <span
      data-slot="chip-wheel"
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setHovered(false);
      }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center align-middle",
        className,
      )}
      {...props}
    >
      <span className="sr-only">
        {at(step).label}
      </span>

      {/* every chip stacked invisibly in one cell, so the wheel is as wide as its widest chip and the text never shifts */}
      {items.map((item, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(chipClass, "invisible col-start-1 row-start-1")}
          style={chipColor(item)}
        >
          <ChipFace item={item} />
        </span>
      ))}

      {/* a tall window around the wheel whose mask fades chips out toward the edges, so they melt into any background */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[5.6em] -translate-y-1/2 [mask-image:linear-gradient(to_bottom,transparent_8%,black_38%,black_62%,transparent_92%)] [perspective:18em]"
      >
        {slots.map((k) => (
          <WheelChip key={k} index={k} position={position} item={at(k)} />
        ))}
      </span>
    </span>
  );
}

export { ChipWheel, type ChipWheelItem };
export default ChipWheel;
