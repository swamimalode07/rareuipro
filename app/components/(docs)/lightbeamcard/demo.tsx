"use client";

import LightBeamCard from "@/components/pro/light-beam-card";

export default function LightBeamCardDemo() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <LightBeamCard className="flex w-full max-w-sm flex-col gap-6 p-9">
        <span className="font-runde text-base font-semibold">Rare UI Pro</span>
        <p className="flex items-baseline gap-2 font-runde">
          <span className="text-6xl font-bold tracking-[-0.05em]">$199</span>
          <span className="text-base font-semibold opacity-50">one time</span>
        </p>
        <p className="text-sm font-medium opacity-65">
          Move your pointer across the card.
        </p>
      </LightBeamCard>
    </div>
  );
}
