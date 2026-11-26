"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TEMPLATE_CATEGORIES, templates, type TemplateCategory } from "@/lib/templates";
import { cn } from "@/lib/utils";
import TemplateCard from "./TemplateCard";

type Filter = "All" | TemplateCategory;

export default function TemplateGallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const reduceMotion = useReducedMotion();

  const filters: Filter[] = ["All", ...TEMPLATE_CATEGORIES];
  const shown = filter === "All" ? templates : templates.filter((t) => t.category === filter);
  return (
    <div className="mt-12 flex flex-col gap-8">
      <div
        role="tablist"
        aria-label="Template categories"
        className="mx-auto flex h-12 items-center gap-1 rounded-full border border-black/[0.06] bg-white/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/[0.07] dark:bg-[#161616]/75 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        {filters.map((name) => {
          const selected = filter === name;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(name)}
              className={cn(
                "relative h-full rounded-full px-4 font-runde text-sm font-medium transition-colors duration-150 ease-out",
                selected
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-white/55 dark:hover:text-white",
              )}
            >
              {selected && (
                <motion.span
                  layoutId="template-filter"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-black/[0.06] dark:bg-white/[0.09]"
                />
              )}
              <span className="relative">{name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {shown.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </div>
    </div>
  );
}
