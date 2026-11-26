"use client";

import Folder from "@/components/pro/folder";

// components without a recorded video render a small live version in their card
const PREVIEWS: Record<string, React.ReactNode> = {
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
