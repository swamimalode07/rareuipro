"use client";

import Folder from "@/components/pro/folder";
import LightBeamCard from "@/components/pro/light-beam-card";
// components without a recorded video render a small live version in their card
const PREVIEWS: Record<string, React.ReactNode> = {
  "light-beam-card": (
    <div className="size-full bg-white p-4 dark:bg-[#1A1A1A]">
      <LightBeamCard className="flex size-full flex-col justify-end gap-1 rounded-[22px] p-6">
        <span className="font-runde text-3xl font-bold tracking-[-0.04em]">$199</span>
        <span className="text-xs font-semibold opacity-50">one time</span>
      </LightBeamCard>
    </div>
  ),
  folder: (
    <div className="flex size-full items-center justify-center bg-white pt-6 dark:bg-[#1A1A1A]">
      <Folder
        className="w-36"
        items={[
          <div key="yellow" className="size-full bg-[#F2B632]" />,
          <div key="blue" className="size-full bg-[#4F74E8]" />,
          <div key="red" className="size-full bg-[#E5484D]" />,
          <div key="green" className="size-full bg-[#3FAF6C]" />,
        ]}
      />
    </div>
  ),
};

export function hasLivePreview(registry?: string) {
  return Boolean(registry && registry in PREVIEWS);
}

export default function LivePreview({ registry }: { registry: string }) {
  return PREVIEWS[registry] ?? null;
}
