"use client";

import * as React from "react";
import SlidingPuzzle from "@/components/pro/sliding-puzzle";

const PROMPT = "Soft clouds drifting across an orange sky";
const IMAGE = "/assets/landing/herobg.webp";

// stands in for a real model: the image arrives a few seconds after the prompt
function useFakeGeneration(run: number) {
  const [src, setSrc] = React.useState<string>();

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSrc(IMAGE), 3000);
    return () => {
      window.clearTimeout(timer);
      setSrc(undefined);
    };
  }, [run]);

  return src;
}

export default function SlidingPuzzleDemo() {
  const [run, setRun] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const src = useFakeGeneration(run);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <SlidingPuzzle
        key={run}
        prompt={PROMPT}
        src={src}
        alt="Soft white clouds across a bright orange sky"
        onReveal={() => setDone(true)}
      />
      <button
        type="button"
        disabled={!done}
        onClick={() => {
          setDone(false);
          setRun((n) => n + 1);
        }}
        className="cursor-pointer rounded-full bg-black/[0.04] px-4 py-1.5 font-runde text-sm font-medium text-foreground/70 transition-[color,opacity] hover:text-foreground disabled:cursor-default disabled:opacity-40 dark:bg-white/[0.06]"
      >
        Generate again
      </button>
    </div>
  );
}
