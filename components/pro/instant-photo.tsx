"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type InstantPhotoProps = Omit<React.ComponentProps<"div">, "children"> & {
  prompt: string;
  src?: string;
  alt?: string;
  onReveal?: () => void;
  onImageError?: () => void;
};

const DEVELOP_S = 3.2;

// the motor pushes the print out in short bursts, like a real instant camera
const EJECT = {
  y: ["-100%", "-72%", "-70%", "-38%", "-36%", "0%"],
  times: [0, 0.22, 0.34, 0.6, 0.72, 1],
};

const UNDEVELOPED =
  "brightness(0.2) saturate(0) contrast(0.85) sepia(0.6) blur(6px)";
const DEVELOPED = "brightness(1) saturate(1) contrast(1) sepia(0) blur(0px)";

function InstantPhoto({
  prompt,
  src,
  alt,
  onReveal,
  onImageError,
  className,
  ...props
}: InstantPhotoProps) {
  const reduceMotion = useReducedMotion();
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [ejected, setEjected] = React.useState(false);
  const [loadedSrc, setLoadedSrc] = React.useState<string>();
  const [revealedSrc, setRevealedSrc] = React.useState<string>();
  const loaded = !!src && loadedSrc === src;
  const developing = loaded && (ejected || !!reduceMotion);
  const revealed = !!src && revealedSrc === src;

  // a cached image can finish loading before hydration, when onLoad never fires
  React.useEffect(() => {
    const image = imageRef.current;
    if (src && image?.complete && image.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  return (
    <div
      data-slot="instant-photo"
      data-state={revealed ? "done" : "generating"}
      role="img"
      aria-label={revealed ? (alt ?? prompt) : `Generating: ${prompt}`}
      aria-busy={!revealed}
      className={cn("relative w-72", className)}
      {...props}
    >
      <div className="relative h-5 rounded-full bg-gradient-to-b from-[#2B2B2D] to-[#111112] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.3)]">
        <div className="absolute inset-x-[4%] top-[9px] h-[3px] rounded-full bg-black shadow-[0_1px_0_rgb(255_255_255/0.06)]" />
      </div>

      {/* starts at the slit so the print comes out of it; the padding leaves room for its shadow */}
      <div className="relative z-10 -mt-[9px] overflow-hidden px-[6%] pb-10">
        <motion.div
          initial={reduceMotion ? false : { y: "-100%" }}
          animate={{ y: EJECT.y }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.6, times: EJECT.times, ease: "easeInOut" }
          }
          onAnimationComplete={() => setEjected(true)}
          className="relative rounded-[3px] bg-[#F7F4EE] p-3 pb-0 shadow-[0_1px_1px_rgb(0_0_0/0.12),0_6px_14px_-4px_rgb(0_0_0/0.25),0_18px_30px_-12px_rgb(0_0_0/0.25)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 rounded-t-[3px] bg-gradient-to-b from-black/25 to-transparent"
          />
          <div className="relative aspect-square overflow-hidden rounded-[1px] bg-[#1E1C1A] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.18)]">
            {!developing && (
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_35%,rgb(120_96_80/0.35),transparent),radial-gradient(50%_60%_at_75%_70%,rgb(70_80_96/0.35),transparent)] bg-[length:200%_200%]"
                animate={
                  reduceMotion
                    ? undefined
                    : { backgroundPosition: ["0% 0%", "100% 100%"] }
                }
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }}
              />
            )}
            {src && (
              <motion.img
                ref={imageRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={() => setLoadedSrc(src)}
                onError={() => onImageError?.()}
                initial={false}
                animate={
                  developing
                    ? { opacity: 1, filter: DEVELOPED }
                    : { opacity: 0, filter: UNDEVELOPED }
                }
                transition={{
                  duration: reduceMotion ? 0.4 : DEVELOP_S,
                  ease: [0.3, 0, 0.2, 1],
                }}
                onAnimationComplete={() => {
                  if (developing && !revealed) {
                    setRevealedSrc(src);
                    onReveal?.();
                  }
                }}
                className="absolute inset-0 size-full object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgb(255_255_255/0.14),transparent_40%)]"
            />
          </div>
          <div className="flex min-h-14 items-center justify-center px-2 py-3">
            <p className="line-clamp-2 text-center text-[13px] leading-snug text-balance text-neutral-500">
              {prompt}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export { InstantPhoto, type InstantPhotoProps };
export default InstantPhoto;
