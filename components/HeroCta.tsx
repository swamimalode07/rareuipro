"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { motion, useReducedMotion } from "motion/react";

const spring = { type: "spring", stiffness: 300, damping: 22 } as const;

export default function HeroCta() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={spring}
      className="shrink-0"
    >
      <Squircle asChild cornerRadius={16} cornerSmoothing={1}>
        <Link
          href="/components"
          className="flex h-11 items-center bg-[#FC4C01] px-5 font-runde text-[15px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-[#ff5a12]"
        >
          Explore RareUI Pro
        </Link>
      </Squircle>
    </motion.div>
  );
}
