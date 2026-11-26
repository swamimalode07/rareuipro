"use client";

import * as React from "react";
import VoiceOrb, { type VoiceOrbState } from "@/components/pro/voice-orb";

const STATES: { value: VoiceOrbState; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
];

// stands in for a real voice: uneven, speech-like loudness with short pauses
function useFakeVoice(active: boolean) {
  const [level, setLevel] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const syllables = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1));
      const pause = Math.sin(t * 1.3) > -0.6 ? 1 : 0.1;
      setLevel(0.15 + syllables * 0.8 * pause);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return active ? level : 0;
}

export default function VoiceOrbDemo() {
  const [state, setState] = React.useState<VoiceOrbState>("idle");
  const level = useFakeVoice(state !== "idle");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 p-6">
      <VoiceOrb
        state={state}
        level={level}
        onStart={() => setState("listening")}
        onStop={() => setState("speaking")}
        onInterrupt={() => setState("listening")}
      />
      <div
        role="radiogroup"
        aria-label="Orb state"
        className="flex gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]"
      >
        {STATES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={state === option.value}
            onClick={() => setState(option.value)}
            className="cursor-pointer rounded-full px-4 py-1.5 font-runde text-sm font-medium text-foreground/50 transition-colors hover:text-foreground/80 aria-checked:bg-white aria-checked:text-foreground aria-checked:shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.06)] dark:aria-checked:bg-white/10 dark:aria-checked:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
