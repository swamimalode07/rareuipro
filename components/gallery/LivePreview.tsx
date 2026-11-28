"use client";

import * as React from "react";
import { Mail, Music2, PenTool } from "lucide-react";
import AttachmentTray from "@/components/pro/attachment-tray";
import ChipWheel from "@/components/pro/chip-wheel";
import { Phone } from "@/components/pro/device-mockups";
import Folder from "@/components/pro/folder";
import ImageGeneration from "@/components/pro/image-generation";
import InstantPhoto from "@/components/pro/instant-photo";
import NotificationMenu from "@/components/pro/notification-menu";
import Receipt from "@/components/pro/receipt";
import TileReveal from "@/components/pro/tile-reveal";
import VoiceOrb from "@/components/pro/voice-orb";

function VoiceOrbPreview() {
  const [level, setLevel] = React.useState(0);
  React.useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      const t = now / 1000;
      setLevel(0.25 + Math.abs(Math.sin(t * 6.1) * Math.sin(t * 1.7)) * 0.7);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <VoiceOrb state="listening" level={level} tabIndex={-1} />;
}

// components without a recorded video render a small live version in their card
const PREVIEWS: Record<string, React.ReactNode> = {
  "device-mockups": (
    <div className="flex size-full items-end justify-center overflow-hidden bg-white pt-6 dark:bg-[#1A1A1A]">
      <Phone className="w-[46%] translate-y-[38%]" statusBar={false}>
        <div className="size-full bg-[#F5F5F7]" />
      </Phone>
    </div>
  ),
  "attachment-tray": (
    <div className="flex size-full items-center justify-center bg-white px-6 dark:bg-[#1A1A1A]">
      <AttachmentTray>
        <p className="px-5 pb-1 pt-4 text-[15px] text-neutral-400">
          Ask anything, or drop a file here
        </p>
      </AttachmentTray>
    </div>
  ),
  "image-generation": (
    <div className="flex size-full items-center justify-center bg-white dark:bg-[#1A1A1A]">
      <ImageGeneration
        className="w-44"
        prompt="Soft clouds drifting across an orange sky"
      />
    </div>
  ),
  "instant-photo": (
    <div className="flex size-full items-start justify-center overflow-hidden bg-white pt-4 dark:bg-[#1A1A1A]">
      <InstantPhoto
        className="w-40"
        prompt="Soft clouds drifting across an orange sky"
        src="/assets/landing/herobg.webp"
      />
    </div>
  ),
  "tile-reveal": (
    <div className="flex size-full items-center justify-center bg-white dark:bg-[#1A1A1A]">
      <TileReveal
        className="w-44"
        columns={6}
        prompt="Soft clouds drifting across an orange sky"
      />
    </div>
  ),
  "voice-orb": (
    <div className="flex size-full items-center justify-center bg-white dark:bg-[#1A1A1A]">
      <VoiceOrbPreview />
    </div>
  ),
  "notification-menu": (
    <div className="flex size-full items-center justify-center bg-white dark:bg-[#1A1A1A]">
      <NotificationMenu
        notifications={[
          { id: "1", title: "Maya Chen", time: "2m" },
          { id: "2", title: "Deploy finished", time: "18m" },
          { id: "3", title: "Jonas Weber", time: "1h" },
        ]}
      />
    </div>
  ),
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
            {
              label: "Music",
              icon: <Music2 strokeWidth={2.5} />,
              color: "#1FAF5A",
            },
            {
              label: "Sketch",
              icon: <PenTool strokeWidth={2.5} />,
              color: "#F07A2B",
            },
            {
              label: "Mail",
              icon: <Mail strokeWidth={2.5} />,
              color: "#2F80ED",
            },
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
