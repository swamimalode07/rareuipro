"use client";

import { useState } from "react";
import type { ComponentItem } from "@/lib/components";
import { cn } from "@/lib/utils";
import GalleryCard from "./GalleryCard";
import LivePreview, { hasLivePreview } from "./LivePreview";
import PreviewFallback from "./PreviewFallback";
import PreviewVideo from "./PreviewVideo";

export default function ComponentCard({
  item,
  large = false,
  autoPlay = false,
  className,
}: {
  item: ComponentItem;
  large?: boolean;
  autoPlay?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(false);

  const media = item.preview ? (
    <PreviewVideo src={item.preview} scale={item.previewScale} playing={active} autoPlay={autoPlay} />
  ) : hasLivePreview(item.registry) ? (
    <LivePreview registry={item.registry!} />
  ) : (
    <PreviewFallback />
  );

  return (
    <GalleryCard
      href={item.href}
      prefetch={active ? null : false}
      media={media}
      title={item.name}
      badge={item.isNew ? "New" : undefined}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      mediaClassName={cn(large && "lg:aspect-auto lg:flex-1")}
      className={cn(large && "lg:h-full", className)}
    />
  );
}
