"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  time: string;
  read?: boolean;
  avatar?: React.ReactNode;
};

type NotificationMenuProps = React.ComponentProps<"div"> & {
  notifications: NotificationItem[];
  heading?: string;
  emptyText?: string;
  align?: "start" | "center" | "end";
  onRead?: (id: string) => void;
  onReadAll?: () => void;
};

const BELL = 44;
const GAP = 10;
const PANEL_WIDTH = 352;
const MAX_COUNT = 9;

const grow: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 32,
  mass: 0.9,
};
const pop: Transition = { type: "spring", stiffness: 420, damping: 30 };
const roll: Transition = { type: "spring", stiffness: 500, damping: 34 };

// soft tints for initials avatars, picked from the name so each person keeps theirs
const TINTS = [
  ["#E8F1FF", "#2F6FDB"],
  ["#EAF7EF", "#22874E"],
  ["#FFF1E6", "#C2560F"],
  ["#F3EDFF", "#6B4BC8"],
  ["#FFEDEF", "#C23B4A"],
  ["#EEF2F4", "#4B5A63"],
];

function tint(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-[18px]"
    >
      <path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v2.9c0 .9-.3 1.8-.9 2.5l-.6.8c-.7.9-.1 2.3 1.1 2.3h13.8c1.2 0 1.8-1.4 1.1-2.3l-.6-.8c-.6-.7-.9-1.6-.9-2.5V9A6.5 6.5 0 0 0 12 2.5Z" />
      <path d="M9.3 19.5h5.4a2.8 2.8 0 0 1-5.4 0Z" />
    </svg>
  );
}

function NotificationMenu({
  notifications,
  heading = "Notifications",
  emptyText = "You're all caught up.",
  align = "center",
  onRead,
  onReadAll,
  className,
  ...props
}: NotificationMenuProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<Set<string>>(() => new Set());
  const [bell, animateBell] = useAnimate();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();

  const isRead = (n: NotificationItem) => n.read || readIds.has(n.id);
  const unread = notifications.filter((n) => !isRead(n)).length;
  const label = unread > MAX_COUNT ? `${MAX_COUNT}+` : String(unread);

  const previous = React.useRef(unread);
  React.useEffect(() => {
    if (unread > previous.current && !reduceMotion && bell.current) {
      animateBell(
        bell.current,
        { rotate: [0, 16, -13, 9, -5, 2, 0] },
        { duration: 0.8, ease: "easeOut" },
      );
    }
    previous.current = unread;
  }, [unread, reduceMotion, animateBell, bell]);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = (id: string) => {
    if (readIds.has(id)) return;
    setReadIds((prev) => new Set(prev).add(id));
    onRead?.(id);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    onReadAll?.();
  };

  // the panel starts as a bell-sized pill sitting on the bell, then drops and widens into place
  const closed = {
    width: BELL,
    height: BELL,
    y: -(BELL + GAP),
    borderRadius: BELL / 2,
    opacity: 0,
  };
  const opened = {
    width: PANEL_WIDTH,
    height: "auto",
    y: 0,
    borderRadius: 26,
    opacity: 1,
  };

  return (
    <div
      ref={rootRef}
      data-slot="notification-menu"
      className={cn("relative inline-flex", className)}
      {...props}
    >
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `${heading}, ${unread} unread` : heading}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        transition={pop}
        className="relative z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-800 shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.035),0_2px_4px_-2px_rgb(0_0_0/0.025)] outline-none transition-colors duration-150 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-black/15 dark:bg-[#222224] dark:text-neutral-100 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),inset_0_0_0_1px_rgb(255_255_255/0.04),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.5)] dark:hover:bg-[#28282A] dark:focus-visible:ring-white/20"
      >
        <span ref={bell} className="flex origin-[50%_15%]">
          <BellIcon />
        </span>

        <AnimatePresence initial={false}>
          {unread > 0 && (
            <motion.span
              key="badge"
              aria-hidden="true"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : pop}
              className="absolute -right-[3px] -top-[3px] flex h-[18px] min-w-[18px] items-center justify-center overflow-hidden rounded-full bg-[#FC4C01] px-[5px] text-[10.5px] font-semibold tabular-nums leading-none text-white"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={label}
                  initial={reduceMotion ? false : { y: "70%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-70%", opacity: 0 }}
                  transition={roll}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div
        className={cn(
          "pointer-events-none absolute top-[calc(100%+10px)] flex w-[22rem] max-w-[calc(100vw-2rem)]",
          align === "center" && "left-1/2 -translate-x-1/2 justify-center",
          align === "start" && "left-0 justify-start",
          align === "end" && "right-0 justify-end",
        )}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              id={panelId}
              role="dialog"
              aria-label={heading}
              initial={reduceMotion ? { ...opened, opacity: 0 } : closed}
              animate={opened}
              exit={reduceMotion ? { ...opened, opacity: 0 } : closed}
              transition={
                reduceMotion
                  ? { duration: 0.12 }
                  : { ...grow, opacity: { duration: 0.15 } }
              }
              className={cn(
                "pointer-events-auto flex max-w-full overflow-hidden bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_1px_2px_rgb(0_0_0/0.035),0_2px_4px_-2px_rgb(0_0_0/0.025)] dark:bg-[#1E1E20] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),inset_0_0_0_1px_rgb(255_255_255/0.04),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.5)]",
                align === "center" && "justify-center",
                align === "end" && "justify-end",
              )}
            >
              {/* fixed width inside a growing frame, so nothing reflows while the panel opens */}
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: reduceMotion ? 0 : 0.12, duration: 0.2 },
                }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                className="w-[22rem] max-w-[calc(100vw-2rem)] shrink-0"
              >
                <div className="flex items-center justify-between gap-3 py-3.5 pl-5 pr-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-runde text-[15px] font-semibold tracking-tight">
                      {heading}
                    </span>
                    {unread > 0 && (
                      <span className="text-[13px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500">
                        {unread} new
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unread === 0}
                    className="h-7 cursor-pointer rounded-full px-2.5 text-[12.5px] font-medium text-neutral-400 outline-none transition-colors duration-150 hover:bg-black/[0.05] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-black/15 disabled:pointer-events-none disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
                  >
                    Mark all read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[13px] text-neutral-500">
                    {emptyText}
                  </p>
                ) : (
                  <ul className="flex max-h-[22rem] flex-col overflow-y-auto px-1.5 pb-1.5">
                    {notifications.map((n, i) => {
                      const read = isRead(n);
                      const [bg, fg] = tint(n.title);
                      return (
                        <motion.li
                          key={n.id}
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            ...pop,
                            delay: reduceMotion ? 0 : 0.14 + i * 0.035,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="group flex w-full cursor-pointer items-start gap-3 rounded-[20px] px-3.5 py-3 text-left outline-none transition-colors duration-150 hover:bg-black/[0.035] focus-visible:bg-black/[0.035] dark:hover:bg-white/[0.045] dark:focus-visible:bg-white/[0.045]"
                          >
                            <span
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--tint-bg)] text-[11px] font-semibold text-[var(--tint-fg)] dark:bg-[color-mix(in_oklab,var(--tint-fg)_18%,transparent)] dark:text-[color-mix(in_oklab,var(--tint-fg)_50%,white)]"
                              style={
                                {
                                  "--tint-bg": bg,
                                  "--tint-fg": fg,
                                } as React.CSSProperties
                              }
                            >
                              {n.avatar ?? initials(n.title)}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="flex items-baseline justify-between gap-3">
                                <span
                                  className={cn(
                                    "truncate text-[13.5px] font-medium tracking-[-0.005em] transition-colors duration-200",
                                    read
                                      ? "text-neutral-400 dark:text-neutral-500"
                                      : "text-neutral-900 dark:text-white",
                                  )}
                                >
                                  {n.title}
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                  {n.time}
                                  <motion.span
                                    aria-hidden="true"
                                    initial={false}
                                    animate={{
                                      scale: read ? 0 : 1,
                                      opacity: read ? 0 : 1,
                                    }}
                                    transition={
                                      reduceMotion ? { duration: 0 } : pop
                                    }
                                    className="size-1.5 rounded-full bg-neutral-900 dark:bg-white"
                                  />
                                </span>
                              </span>
                              {n.body && (
                                <span
                                  className={cn(
                                    "line-clamp-2 text-[12.5px] leading-[1.45] transition-colors duration-200",
                                    read
                                      ? "text-neutral-400 dark:text-neutral-600"
                                      : "text-neutral-500 dark:text-neutral-400",
                                  )}
                                >
                                  {n.body}
                                </span>
                              )}
                            </span>
                            <span className="sr-only">
                              {read ? "Read" : "Unread"}
                            </span>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { NotificationMenu, type NotificationItem };
export default NotificationMenu;
