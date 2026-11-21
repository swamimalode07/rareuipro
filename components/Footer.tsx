import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";
import HeroCta from "./HeroCta";
import PetalField from "./hero/PetalField";
import { RareuiProLogo, XLogo } from "./logos";

const X_URL = "https://x.com/swamimalode";
const DMCA_ID = "ee2a2636-6919-4dcc-a846-c70b066419b8";
const DMCA_STATUS_URL = `https://www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}&refurl=${SITE_URL}`;

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Components", href: "/components" },
      { label: "Templates", href: "/templates" },
      { label: "Get Pro", href: "/account" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Testimonials", href: "/testimonials" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const HOVER =
  "transition-colors duration-150 ease-out hover:text-black dark:hover:text-white";

const MUTED = "text-black/50 dark:text-white/50";

function DmcaBadge() {
  return (
    <a
      href={DMCA_STATUS_URL}
      target="_blank"
      rel="noreferrer"
      title="DMCA.com Protection Status"
      className="flex h-4.25 w-fit overflow-hidden rounded-[3px] font-runde text-[9px] font-bold uppercase leading-none tracking-[0.06em] shadow-[0_0_3px_rgba(0,0,0,0.16)] dark:shadow-[0_0_3px_rgba(0,0,0,0.55)]"
    >
      <span className="flex items-center bg-[#ff3300] px-1.5 text-[#282828]">
        DMCA
      </span>
      <span className="flex items-center bg-[#282828] px-1.5 text-[#ff3300]">
        Protected
      </span>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-6xl px-6 pt-20 sm:px-10 md:pt-28">
        <div className="h-px w-full bg-black/[0.08] dark:bg-white/10" />

        <div className="flex flex-col gap-12 py-12 md:flex-row md:justify-between">
          <div className="flex max-w-xs flex-col gap-4">
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <RareuiProLogo className="size-7" />
              <span className="font-runde text-xl font-bold tracking-tight">
                Rare UI <span className="text-[#FC4C01]">Pro</span>
              </span>
            </Link>
            <p className={`text-sm font-medium leading-relaxed ${MUTED}`}>
              Tasteful interfaces, made to feel rare.
            </p>
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className={`w-fit ${MUTED} ${HOVER}`}
            >
              <XLogo className="size-5" />
            </a>
          </div>

          <nav className="grid grid-cols-2 gap-x-14 gap-y-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3.5">
                <span className="font-runde text-sm font-semibold">
                  {column.title}
                </span>
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`w-fit text-sm font-medium ${MUTED} ${HOVER}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="relative h-[min(70svh,40rem)] min-h-[24rem]">
        <PetalField center={[0.5, 1.5]} size={1.9} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-white to-transparent dark:from-black" />

        <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 pb-20 text-center">
          <RareuiProLogo className="size-10" />
          <p className="max-w-sm text-balance font-runde text-lg font-semibold text-black/70 dark:text-white/70">
            Every component, block and template. One license.
          </p>
          <HeroCta />
        </div>

        <div
          className={`selection-contrast absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-6 text-xs sm:px-10 ${MUTED}`}
        >
          <span className="flex flex-wrap items-center gap-2.5">
            <span>Rare UI &copy; {new Date().getFullYear()}</span>
            <span aria-hidden="true" className="text-black/25 dark:text-white/25">
              &middot;
            </span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={HOVER}>
              {SUPPORT_EMAIL}
            </a>
          </span>
          <DmcaBadge />
        </div>
      </div>
    </footer>
  );
}
