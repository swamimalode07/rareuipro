"use client";

import { useRef } from "react";
import Folder from "@/components/pro/folder";
import ColorSwatches from "@/components/preview/ColorSwatches";
import { usePreviewControl } from "@/components/preview/PreviewControls";
import { useIsMobile } from "@/lib/use-media-query";

function PlayCard({ color, value }: { color: string; value: string }) {
  const corner = "absolute font-runde text-[22cqw] font-bold leading-none text-white";

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden [container-type:inline-size]"
      style={{ background: color }}
    >
      <span className="absolute h-[96%] w-[74%] rotate-[28deg] rounded-[50%] bg-white" />
      <span
        className="relative font-runde text-[62cqw] font-bold leading-none"
        style={{ color, textShadow: "-1.5cqw 1.5cqw 0 rgb(0 0 0 / 0.75)" }}
      >
        {value}
      </span>
      <span className={`${corner} left-[9cqw] top-[7cqw]`}>{value}</span>
      <span className={`${corner} bottom-[7cqw] right-[9cqw] rotate-180`}>{value}</span>
    </div>
  );
}

export default function FolderDemo() {
  const [color] = usePreviewControl("color", "#8C9BFF");
  const isMobile = useIsMobile();
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={previewRef}
      className="relative flex h-full items-center justify-center p-6 pt-24"
    >
      <Folder
        color={color}
        className={isMobile ? "w-52" : undefined}
        label="Game night"
        count={108}
        countLabel="cards"
        items={[
          <PlayCard key="yellow" color="#F2B632" value="7" />,
          <PlayCard key="blue" color="#4F74E8" value="2" />,
          <PlayCard key="red" color="#E5484D" value="5" />,
          <PlayCard key="green" color="#3FAF6C" value="9" />,
        ]}
      />

      <ColorSwatches
        draggable
        constraintsRef={previewRef}
        className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-2xl bg-muted px-4 py-2.5 shadow-xl backdrop-blur"
      />
    </div>
  );
}
