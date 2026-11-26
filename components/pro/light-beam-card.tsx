"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const REST_ANGLE = -40;
const SWAY = 10;
const spring = { stiffness: 120, damping: 20, mass: 0.8 } as const;

type LightBeamCardProps = React.ComponentProps<"div"> & {
  color?: string;
  strands?: boolean;
  intensity?: number;
};

function LightBeamCard({
  color = "#FC4C01",
  strands = true,
  intensity = 1,
  className,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: LightBeamCardProps) {
  const reduceMotion = useReducedMotion();
  const pointer = useMotionValue(0.5);
  const smooth = useSpring(pointer, spring);
  const angle = useTransform(smooth, [0, 1], [REST_ANGLE - SWAY, REST_ANGLE + SWAY]);
  const transform = useMotionTemplate`rotate(${angle}deg)`;

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    pointer.set((event.clientX - box.left) / box.width);
  };

  const handleLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    pointer.set(0.5);
  };

  const beamStyle = { transform, opacity: intensity, transformOrigin: "0% 100%" };

  return (
    <div
      data-slot="light-beam-card"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ "--beam": color, cornerShape: "squircle", ...style } as React.CSSProperties}
      className={cn(
        "relative isolate overflow-hidden rounded-[36px] bg-neutral-100 p-8 text-neutral-900 dark:bg-neutral-950 dark:text-white",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(130%_110%_at_0%_100%,#000_30%,transparent_75%)]"
      >
        <motion.div
          style={beamStyle}
          className="absolute bottom-0 left-0 h-[55%] w-[150%] -translate-x-[12%] translate-y-[38%] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--beam)_20%,white)_0%,color-mix(in_srgb,var(--beam)_70%,white)_12%,var(--beam)_30%,color-mix(in_srgb,var(--beam)_45%,transparent)_50%,transparent_75%)] blur-[34px]"
        />
        <motion.div
          style={beamStyle}
          className="absolute bottom-0 left-0 h-[18%] w-[110%] -translate-x-[4%] translate-y-[20%] bg-[linear-gradient(90deg,white_0%,color-mix(in_srgb,var(--beam)_45%,white)_10%,var(--beam)_26%,color-mix(in_srgb,var(--beam)_20%,transparent)_55%,transparent_78%)] blur-[14px]"
        />
        {strands && (
          // hairlines run along the beam, so the light reads as fibre rather than a blob
          <motion.div
            style={beamStyle}
            className="absolute bottom-0 left-0 h-[55%] w-[150%] -translate-x-[12%] translate-y-[38%] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_6px)] [mask-image:linear-gradient(90deg,#000_0%,rgba(0,0,0,0.5)_30%,transparent_60%)]"
          />
        )}
      </div>
      {children}
    </div>
  );
}

export { LightBeamCard };
export default LightBeamCard;
