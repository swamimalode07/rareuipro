import Link from "next/link";
import { cn } from "@/lib/utils";

const squircle = { cornerShape: "squircle" } as React.CSSProperties;

type GalleryCardProps = {
  media: React.ReactNode;
  title: string;
  meta?: string;
  badge?: string;
  description?: string;
  // a whole-card link shows the arrow; without one, actions sit in the footer instead
  href?: string;
  prefetch?: boolean | null;
  actions?: React.ReactNode;
  mediaClassName?: string;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "title">;

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export default function GalleryCard({
  media,
  title,
  meta,
  badge,
  description,
  href,
  prefetch,
  actions,
  mediaClassName,
  className,
  ...props
}: GalleryCardProps) {
  const shell = cn(
    "group flex flex-col rounded-[32px] border border-black/[0.04] bg-[#F5F5F7] p-2 transition-colors duration-200 ease-out dark:border-transparent dark:border-apple dark:bg-[#121212]",
    href && "dark:hover:bg-muted",
    className,
  );

  const body = (
    <>
      <div
        className={cn(
          "relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white dark:border-neutral-500/15 dark:bg-neutral-950",
          mediaClassName,
        )}
        style={squircle}
      >
        {media}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-3 pb-2 pt-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 font-runde text-base font-semibold tracking-tight">
            <span className="truncate">
              {title}
              {meta && (
                <span className="font-medium text-black/40 dark:text-white/40"> {meta}</span>
              )}
            </span>
            {badge && (
              <span className="shrink-0 rounded-full bg-[#FC4C01]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#FC4C01]">
                {badge}
              </span>
            )}
          </h3>
          {description && (
            <p className="text-sm font-medium text-muted-foreground">{description}</p>
          )}
        </div>
        {href ? (
          <span className="shrink-0 self-center text-[#FC4C01]">
            <ArrowIcon />
          </span>
        ) : (
          actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>
        )}
      </div>
    </>
  );

  return href ? (
    <Link href={href} prefetch={prefetch} className={shell} style={squircle} {...props}>
      {body}
    </Link>
  ) : (
    <article className={shell} style={squircle} {...props}>
      {body}
    </article>
  );
}
