"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import HeroCta from "@/components/HeroCta";
import { ClaudeLogo, CursorLogo, OpenaiLogo, VscodeLogo } from "@/components/logos";
import PetalField from "./PetalField";

const spring = { type: "spring", stiffness: 260, damping: 24 } as const;
const STEP = 0.09;

const AGENTS = [
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Cursor", Logo: CursorLogo },
  { name: "Codex", Logo: OpenaiLogo },
  { name: "VS Code", Logo: VscodeLogo },
];

export default function ProHero() {
  const veilRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const rise = (index: number) => ({
    initial: reduceMotion ? false : { y: 18, opacity: 0, filter: "blur(6px)" },
    animate: { y: 0, opacity: 1, filter: "blur(0px)" },
    transition: reduceMotion ? { duration: 0 } : { ...spring, delay: 0.35 + index * STEP },
  });

  return (
    <>
      <PetalField veilRef={veilRef} />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 md:pt-32">
        <div ref={veilRef} className="flex flex-col items-center">
          <motion.h1
            {...rise(0)}
            className="max-w-4xl text-balance font-runde text-[2.6rem] font-bold leading-[0.95] tracking-[-0.045em] text-black dark:text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          >
            Tasteful interfaces,
            <br />
            <span className="text-black/40 dark:text-white/45">made to feel rare.</span>
          </motion.h1>

          <motion.p
            {...rise(1)}
            className="mt-4 max-w-xl text-balance font-medium text-black/60 dark:text-white/60 sm:text-lg"
          >
            Components, blocks and templates with motion built in. Install any of them with the shadcn CLI.
          </motion.p>

          <motion.div {...rise(2)} className="mt-9 flex flex-wrap items-center justify-center gap-2">
            <HeroCta />
            <Link
              href="/account"
              className="group flex h-11 items-center gap-1.5 rounded-[14px] px-4 font-runde text-[15px] font-semibold text-black/60 transition-colors duration-150 ease-out hover:bg-black/[0.05] hover:text-black dark:text-white/70 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              View pricing
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>

          <motion.div
            {...rise(3)}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] font-medium text-black/50 dark:text-white/50"
          >
            <span>Works with</span>
            <span className="sr-only">{AGENTS.map((agent) => agent.name).join(", ")}</span>
            <span aria-hidden="true" className="flex items-center gap-2.5 text-black/75 dark:text-white/75">
              {AGENTS.map(({ name, Logo }) => (
                <Logo key={name} className="size-4" />
              ))}
            </span>
            <span>and any agent that speaks shadcn</span>
          </motion.div>
        </div>
      </div>
    </>
  );
}
