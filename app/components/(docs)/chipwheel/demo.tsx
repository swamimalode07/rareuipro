"use client";

import { Camera, CalendarDays, Mail, Music2, PenTool } from "lucide-react";
import ChipWheel from "@/components/pro/chip-wheel";

const apps = [
  { label: "Music", icon: <Music2 strokeWidth={2.5} />, color: "#1FAF5A" },
  { label: "Sketch", icon: <PenTool strokeWidth={2.5} />, color: "#F07A2B" },
  { label: "Calendar", icon: <CalendarDays strokeWidth={2.5} />, color: "#E5484D" },
  { label: "Photos", icon: <Camera strokeWidth={2.5} />, color: "#8E6CEF" },
  { label: "Mail", icon: <Mail strokeWidth={2.5} />, color: "#2F80ED" },
];

export default function ChipWheelDemo() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="flex items-center gap-[0.3em] font-runde text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
        <ChipWheel items={apps} />
        <span>in one place</span>
      </p>
    </div>
  );
}
