import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import GalleryCard from "@/components/gallery/GalleryCard";
import type { TemplateItem } from "@/lib/templates";

export default function TemplateCard({ template }: { template: TemplateItem }) {
  const { name, description, category, image, previewUrl } = template;

  const media = (
    <>
      {/* the whole page scrolls past on hover, so a card shows the full template rather than its first screen */}
      <img
        src={image}
        alt={`${name} template, full page`}
        loading="lazy"
        className="size-full object-cover object-top transition-[object-position] duration-[6000ms] ease-in-out group-hover:object-bottom motion-reduce:transition-none"
      />
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 font-runde text-[11px] font-semibold text-white/90 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-0 [@media(hover:none)]:hidden">
        Hover to scroll
      </span>
    </>
  );

  const actions = (
    <>
      <Link
        href="/account"
        className="flex h-9 items-center rounded-xl px-3 font-runde text-sm font-semibold text-black/60 transition-colors duration-150 ease-out hover:bg-black/[0.05] hover:text-black dark:text-white/65 dark:hover:bg-white/[0.07] dark:hover:text-white"
      >
        Get template
      </Link>
      {previewUrl && (
        <Squircle asChild cornerRadius={12} cornerSmoothing={1}>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center bg-[#141414] px-3.5 font-runde text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-black dark:bg-[#EDEDED] dark:text-black dark:hover:bg-white"
          >
            Live demo
          </a>
        </Squircle>
      )}
    </>
  );

  return (
    <GalleryCard
      media={media}
      title={name}
      meta={category}
      description={description}
      actions={actions}
    />
  );
}
