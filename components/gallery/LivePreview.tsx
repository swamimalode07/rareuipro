"use client";

import { Mail, Music2, PenTool } from "lucide-react";
import ChipWheel from "@/components/pro/chip-wheel";
import Folder from "@/components/pro/folder";
import Receipt from "@/components/pro/receipt";

// components without a recorded video render a small live version in their card
const PREVIEWS: Record<string, React.ReactNode> = {
  receipt: (
    <div className="flex size-full items-start justify-center overflow-hidden bg-white pt-5 dark:bg-[#1A1A1A]">
      <Receipt
        className="w-56 origin-top scale-90"
        stamp=""
        items={[
          { label: "Flat white", price: 4.5, qty: 2 },
          { label: "Banana bread", price: 3.25 },
        ]}
      />
    </div>
  ),
  "chip-wheel": (
    <div className="flex size-full items-center justify-center bg-white dark:bg-[#1A1A1A]">
      <p className="flex items-center gap-[0.25em] font-runde text-2xl font-bold tracking-[-0.03em]">
        <ChipWheel
          items={[
            { label: "Music", icon: <Music2 strokeWidth={2.5} />, color: "#1FAF5A" },
            { label: "Sketch", icon: <PenTool strokeWidth={2.5} />, color: "#F07A2B" },
            { label: "Mail", icon: <Mail strokeWidth={2.5} />, color: "#2F80ED" },
          ]}
        />
        in one place
      </p>
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
