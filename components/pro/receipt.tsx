"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type ReceiptItem = {
  label: string;
  price: number;
  qty?: number;
  note?: string;
};

type ReceiptAdjustment = {
  label: string;
  amount: number;
};

type ReceiptMerchant = {
  name: string;
  address?: string;
  logo?: React.ReactNode;
};

type ReceiptProps = Omit<React.ComponentProps<"div">, "title"> & {
  items: ReceiptItem[];
  merchant?: ReceiptMerchant;
  title?: string;
  meta?: string[];
  adjustments?: ReceiptAdjustment[];
  tax?: { label?: string; rate: number };
  currency?: string;
  locale?: string;
  formatAmount?: (value: number) => string;
  stamp?: string;
  footer?: string;
  barcode?: string;
  paperColor?: string;
  inkColor?: string;
  duration?: number;
  printer?: boolean;
};

const FEED_LINES = 18;

// a thermal printer feeds in short pulses, so the paper surges and pauses once per line
function feed(t: number) {
  const line = Math.min(Math.floor(t * FEED_LINES), FEED_LINES - 1);
  const within = t * FEED_LINES - line;
  return Math.min(1, (line + within * within * (3 - 2 * within)) / FEED_LINES);
}

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// a solid body plus a row of half circles along the bottom, so the paper ends in a soft torn scallop
const tornEdge =
  "linear-gradient(#000 0 0) top / 100% calc(100% - 5px) no-repeat, radial-gradient(circle at 50% 0, #000 4.6px, #0000 5px) bottom / 10px 5px repeat-x";

function barcodeBars(value: string) {
  const bars: number[] = [];
  for (const char of value) {
    const code = char.charCodeAt(0);
    for (let bit = 0; bit < 6; bit++) bars.push(((code >> bit) & 1) + 1);
  }
  return bars;
}

function Rule() {
  return (
    <div className="my-5 h-px bg-[color-mix(in_oklab,var(--ink)_10%,transparent)]" />
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 tabular-nums",
        muted && "opacity-60",
      )}
    >
      <span className="min-w-0">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

function Receipt({
  items,
  merchant,
  title = "Payment successful",
  meta,
  adjustments = [],
  tax,
  currency = "USD",
  locale = "en-US",
  formatAmount,
  stamp = "Paid",
  footer = "Thank you",
  barcode,
  paperColor = "#FAF9F6",
  inkColor = "#262522",
  duration = 2.4,
  printer = true,
  className,
  style,
  children,
  ...props
}: ReceiptProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.3 });
  const [run, setRun] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const format = React.useMemo(() => {
    if (formatAmount) return formatAmount;
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
    return (value: number) => formatter.format(value);
  }, [formatAmount, locale, currency]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.qty ?? 1),
    0,
  );
  const taxable = subtotal + adjustments.reduce((sum, a) => sum + a.amount, 0);
  const taxAmount = tax ? taxable * tax.rate : 0;
  const total = taxable + taxAmount;

  const printing = inView || run > 0;

  return (
    <div
      ref={rootRef}
      data-slot="receipt"
      className={cn("relative flex w-[19rem] flex-col items-center", className)}
      style={
        {
          "--paper": paperColor,
          "--ink": inkColor,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {printer && (
        <>
          {/* the body; its lower part shows as lit ears either side of the paper */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[9rem] rounded-[28px] bg-[linear-gradient(180deg,#D9D9DE_0%,#E6E6EA_45%,#ECECEF_80%,#E0E0E5_100%)] shadow-[inset_0_-2px_0_rgb(0_0_0/0.06),inset_1px_0_0_rgb(255_255_255/0.6),inset_-1px_0_0_rgb(255_255_255/0.6),0_1px_2px_rgb(0_0_0/0.1),0_12px_22px_-8px_rgb(0_0_0/0.2),0_40px_70px_-26px_rgb(0_0_0/0.4)] dark:bg-[linear-gradient(180deg,#1E1E21_0%,#2A2A2E_45%,#303034_80%,#26262A_100%)] dark:shadow-[inset_0_-2px_0_rgb(0_0_0/0.35),inset_1px_0_0_rgb(255_255_255/0.04),inset_-1px_0_0_rgb(255_255_255/0.04),0_40px_70px_-26px_rgb(0_0_0/0.9)]"
          />
          {/* the mouth the paper comes out of, recessed below the cap */}
          <span
            aria-hidden="true"
            className="absolute inset-x-[5%] top-[2.9rem] h-[1.6rem] rounded-[10px] bg-[linear-gradient(180deg,#0E0E0F,#2A2A2C)] shadow-[inset_0_3px_6px_rgb(0_0_0/0.7),0_1px_0_rgb(255_255_255/0.7)] dark:bg-[linear-gradient(180deg,#000,#141415)] dark:shadow-[inset_0_3px_6px_rgb(0_0_0/0.9),0_1px_0_rgb(255_255_255/0.05)]"
          />
          {/* the raised cap; it casts a soft shade down onto the body */}
          <div className="relative z-40 h-[3.25rem] w-full rounded-[28px] bg-[linear-gradient(180deg,#FFFFFF_0%,#F6F6F8_35%,#EAEAEE_75%,#DCDCE1_100%)] shadow-[inset_0_1.5px_0_rgb(255_255_255),inset_0_-2px_1px_rgb(0_0_0/0.07),0_1px_1px_rgb(0_0_0/0.12),0_4px_6px_-2px_rgb(0_0_0/0.12),0_12px_18px_-8px_rgb(0_0_0/0.28)] dark:bg-[linear-gradient(180deg,#4A4A4F_0%,#3A3A3E_35%,#2E2E32_75%,#242427_100%)] dark:shadow-[inset_0_1.5px_0_rgb(255_255_255/0.16),inset_0_-2px_1px_rgb(0_0_0/0.35),0_1px_1px_rgb(0_0_0/0.6),0_12px_18px_-8px_rgb(0_0_0/0.9)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-[3px] h-3 rounded-full bg-[radial-gradient(50%_100%_at_50%_0%,rgb(255_255_255/0.9),transparent)] dark:bg-[radial-gradient(50%_100%_at_50%_0%,rgb(255_255_255/0.12),transparent)]"
            />
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-6 top-1/2 size-1.5 -translate-y-1/2 rounded-full transition-colors duration-300",
                busy
                  ? "bg-[#FC4C01] shadow-[0_0_6px_rgb(252_76_1/0.6)]"
                  : "bg-black/15 dark:bg-white/15",
              )}
            />
            <button
              type="button"
              onClick={() => setRun((n) => n + 1)}
              aria-label="Print again"
              className="absolute right-4 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#ECECEF] shadow-[inset_0_1px_2px_rgb(0_0_0/0.14),0_1px_0_rgb(255_255_255)] outline-none transition-shadow duration-150 active:shadow-[inset_0_2px_4px_rgb(0_0_0/0.24),0_1px_0_rgb(255_255_255)] focus-visible:ring-2 focus-visible:ring-black/15 dark:bg-[#1C1C1E] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.7),0_1px_0_rgb(255_255_255/0.06)]"
            >
              <span className="size-3 rounded-full bg-[linear-gradient(180deg,#FFFFFF,#E2E2E6)] shadow-[0_1px_1px_rgb(0_0_0/0.18)] dark:bg-[linear-gradient(180deg,#3E3E42,#2A2A2E)]" />
            </button>
          </div>
        </>
      )}

      {/* clips only the top edge, so the paper hides inside the printer but its shadow still shows */}
      <div
        className={cn("relative z-30 w-[84%]", printer && "mt-[0.35rem]")}
        style={{ clipPath: "inset(0 -4rem -7rem -4rem)" }}
      >
        <motion.div
          key={run}
          initial={reduceMotion || !printer ? false : { y: "-100%" }}
          animate={printing || !printer ? { y: "0%" } : undefined}
          transition={{ duration, ease: feed }}
          onAnimationStart={() => setBusy(true)}
          onAnimationComplete={() => setBusy(false)}
          className="relative"
        >
          {/* the torn end lifts off the surface a little, so a soft contact shadow sits just beneath it */}
          <span
            aria-hidden="true"
            className="absolute inset-x-[6%] -bottom-3 h-7 rounded-[50%] bg-black/30 blur-[12px] dark:bg-black/70"
          />
          {/* stacked shadows: a hairline edge, a soft side shadow that falls on the printer, and a long one on the surface */}
          <div className="relative [filter:drop-shadow(0_0_0.5px_rgb(0_0_0/0.18))_drop-shadow(0_2px_4px_rgb(0_0_0/0.1))_drop-shadow(0_0_12px_rgb(0_0_0/0.1))_drop-shadow(0_24px_26px_rgb(0_0_0/0.12))] dark:[filter:drop-shadow(0_0_0.5px_rgb(0_0_0/0.5))_drop-shadow(0_0_14px_rgb(0_0_0/0.55))_drop-shadow(0_24px_26px_rgb(0_0_0/0.5))]">
            <div
              className="relative isolate px-6 pb-8 pt-10 font-mono text-[12.5px] leading-[1.55] text-[var(--ink)]"
              style={{
                backgroundColor: "var(--paper)",
                backgroundImage: `${printer ? "linear-gradient(180deg, rgb(0 0 0 / 0.42), rgb(0 0 0 / 0.16) 9px, rgb(255 255 255 / 0.35) 20px, rgb(0 0 0 / 0.07) 34px, rgb(0 0 0 / 0.02) 56px, transparent 80px), " : ""}linear-gradient(180deg, transparent calc(100% - 46px), rgb(0 0 0 / 0.05) calc(100% - 18px), rgb(255 255 255 / 0.25)), linear-gradient(90deg, rgb(0 0 0 / 0.06), rgb(0 0 0 / 0.015) 6%, transparent 14%, transparent 86%, rgb(0 0 0 / 0.015) 94%, rgb(0 0 0 / 0.06)), linear-gradient(180deg, transparent 55%, rgb(0 0 0 / 0.03)), ${grain}`,
                WebkitMask: tornEdge,
                mask: tornEdge,
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 dark:bg-[linear-gradient(180deg,rgb(0_0_0/0.04),rgb(0_0_0/0.12))]"
              />
              {merchant && (
                <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
                  {merchant.logo && <div className="mb-1">{merchant.logo}</div>}
                  <span className="text-[13px] font-bold uppercase tracking-[0.2em]">
                    {merchant.name}
                  </span>
                  {merchant.address && (
                    <span className="text-[10.5px] opacity-55">
                      {merchant.address}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  {title && (
                    <span className="text-[10.5px] uppercase tracking-[0.16em] opacity-60 whitespace-nowrap">
                      {title}
                    </span>
                  )}
                  <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                    {format(total)}
                  </span>
                </div>
                {stamp && (
                  <span className="flex size-[3.1rem] shrink-0 -rotate-[12deg] items-center justify-center rounded-full border-[1.5px] border-dashed border-[#FC4C01]/70 p-[3px]">
                    <span className="flex size-full items-center justify-center rounded-full border-[1.5px] border-[#FC4C01]/80 text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#FC4C01]/85">
                      {stamp}
                    </span>
                  </span>
                )}
              </div>

              {meta && meta.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-2 text-[10.5px] uppercase tracking-[0.1em] opacity-50">
                  {meta.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mr-2">·</span>}
                      {line}
                    </span>
                  ))}
                </div>
              )}

              <Rule />

              <ul className="flex flex-col gap-2.5">
                {items.map((item, i) => (
                  <li key={i} className="flex flex-col">
                    <Row
                      label={
                        <span className="flex gap-2">
                          <span className="opacity-45">{item.qty ?? 1}×</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                      }
                      value={format(item.price * (item.qty ?? 1))}
                    />
                    {item.note && (
                      <span className="pl-[2.1em] text-[10.5px] opacity-45">
                        {item.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <Rule />

              <div className="flex flex-col gap-1.5">
                <Row label="Subtotal" value={format(subtotal)} muted />
                {adjustments.map((a, i) => (
                  <Row key={i} label={a.label} value={format(a.amount)} muted />
                ))}
                {tax && (
                  <Row
                    label={`${tax.label ?? "Tax"} (${+(tax.rate * 100).toFixed(2)}%)`}
                    value={format(taxAmount)}
                    muted
                  />
                )}
              </div>

              <Rule />

              <div className="text-[14px] font-semibold uppercase tracking-[0.06em] opacity-75">
                <Row label="Total" value={format(total)} />
              </div>

              {children && <div className="mt-5">{children}</div>}

              {(footer || barcode) && (
                <div className="mt-7 flex flex-col items-center gap-3">
                  {footer && (
                    <p className="text-center text-[10.5px] uppercase tracking-[0.18em] opacity-50">
                      {footer}
                    </p>
                  )}
                  {barcode && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="flex h-9 items-stretch gap-px opacity-80"
                        aria-hidden="true"
                      >
                        {barcodeBars(barcode).map((w, i) => (
                          <span
                            key={i}
                            className={
                              i % 2 ? "bg-transparent" : "bg-[var(--ink)]"
                            }
                            style={{ width: w }}
                          />
                        ))}
                      </div>
                      <span className="text-[9.5px] tracking-[0.3em] opacity-45">
                        {barcode}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export {
  Receipt,
  type ReceiptItem,
  type ReceiptAdjustment,
  type ReceiptMerchant,
};
export default Receipt;
