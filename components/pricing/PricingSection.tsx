import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { BadgeCheck, LayoutGrid, RefreshCw, SquareTerminal } from "lucide-react";
import LightStrands from "@/components/LightStrands";
import { PRO_PRICE_USD } from "@/lib/site";

const INCLUDED = [
  { icon: LayoutGrid, label: "Every component, block and template" },
  { icon: RefreshCw, label: "Every future drop" },
  { icon: SquareTerminal, label: "Private CLI token for you and your agent" },
  { icon: BadgeCheck, label: "Commercial license" },
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-12 px-5 py-24 sm:px-6 md:py-32"
    >
      <h2 className="text-balance text-center font-runde text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-black sm:text-5xl dark:text-white">
        One price,
        <br />
        <span className="text-black/40 dark:text-white/45">
          everything in Pro.
        </span>
      </h2>

      <div
        className="relative isolate flex w-full max-w-[30rem] flex-col gap-8 overflow-hidden rounded-[36px] bg-[var(--strands-surface)] p-8 [--strands-surface:#F5F5F7] sm:p-10 dark:[--strands-surface:#0E0E0E]"
        style={{ cornerShape: "squircle" } as React.CSSProperties}
      >
        <LightStrands />

        <div className="flex flex-col gap-2">
          <span className="font-runde text-base font-semibold text-black dark:text-white">
            Rare UI Pro
          </span>
          <p className="flex items-baseline gap-3 font-runde">
            <span className="text-6xl font-bold tracking-[-0.05em] tabular-nums text-black dark:text-white">
              ${PRO_PRICE_USD}
            </span>
            <span className="text-base font-semibold text-black/50 dark:text-white/50">
              one time
            </span>
          </p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {INCLUDED.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 text-[15px] font-medium text-black/65 dark:text-white/65"
            >
              <Icon aria-hidden="true" className="size-[18px] shrink-0 text-black dark:text-white" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <Squircle asChild cornerRadius={16} cornerSmoothing={1}>
            <Link
              href="/account"
              className="flex h-12 items-center justify-center bg-[#141414] px-5 font-runde text-[15px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-black dark:bg-[#EDEDED] dark:text-black dark:hover:bg-white"
            >
              Get RareUI Pro
            </Link>
          </Squircle>
          <p className="text-center text-xs font-medium text-black/60 dark:text-white/70">
            Taxes at checkout. 14-day refund if it is not as described.
          </p>
        </div>
      </div>
    </section>
  );
}
