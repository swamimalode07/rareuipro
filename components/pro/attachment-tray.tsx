"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react";
import { cn } from "@/lib/utils";

type Attachment = {
  id: string;
  file: File;
  url?: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  retryable?: boolean;
};

type AttachmentTrayProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  onUpload?: (
    file: File,
    report: (progress: number) => void,
    signal: AbortSignal,
  ) => Promise<void>;
  onFilesChange?: (files: File[]) => void;
  actions?: React.ReactNode;
};

const pop: Transition = { type: "spring", stiffness: 460, damping: 34 };
const settle: Transition = { type: "spring", stiffness: 360, damping: 36 };

function extension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1
    ? name.slice(dot + 1).toLowerCase()
    : "";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// accept works like the file input's attribute: extensions, exact types or type/* wildcards
function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const ext = `.${extension(file.name)}`;
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .some((rule) =>
      rule.startsWith(".")
        ? ext === rule
        : rule.endsWith("/*")
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    );
}

function fingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

// keeps the end of the name, which is usually what tells similar files apart
function FileName({ name }: { name: string }) {
  const ext = extension(name);
  const base = ext ? name.slice(0, -(ext.length + 1)) : name;
  const tail = base.length > 14 ? base.slice(-6) : "";
  const head = tail ? base.slice(0, -6) : base;
  return (
    <span
      className="flex min-w-0 text-[12.5px] font-medium leading-tight text-neutral-900 dark:text-white"
      title={name}
    >
      <span className="truncate">{head}</span>
      <span className="shrink-0">
        {tail}
        {ext && `.${ext}`}
      </span>
    </span>
  );
}

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="size-[18px]"
    >
      <path
        d="m15.2 9.4-5.6 5.6a3.6 3.6 0 0 1-5.1-5.1l6-6a2.4 2.4 0 0 1 3.4 3.4l-6 6a1.2 1.2 0 0 1-1.7-1.7l5.4-5.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="size-2.5"
    >
      <path
        d="m3.5 3.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocumentIcon({ ext }: { ext: string }) {
  return (
    <span className="relative flex h-8 w-[25px] shrink-0">
      <svg
        viewBox="0 0 25 32"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <path
          d="M3 0h13l9 9v20a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z"
          className="fill-white dark:fill-[#3A3A3D]"
        />
        <path
          d="M16 0v6a3 3 0 0 0 3 3h6"
          className="fill-neutral-200 dark:fill-[#505054]"
        />
        <path
          d="M3 .5h12.8l8.7 8.7V29a2.5 2.5 0 0 1-2.5 2.5H3A2.5 2.5 0 0 1 .5 29V3A2.5 2.5 0 0 1 3 .5Z"
          fill="none"
          className="stroke-black/10 dark:stroke-white/10"
        />
      </svg>
      <span className="absolute inset-x-0 bottom-[5px] text-center text-[6px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
        {(ext || "file").slice(0, 4)}
      </span>
    </span>
  );
}

function Tile({
  item,
  onRemove,
  onRetry,
  reduceMotion,
}: {
  item: Attachment;
  onRemove: () => void;
  onRetry: () => void;
  reduceMotion: boolean;
}) {
  const [broken, setBroken] = React.useState(false);
  const failed = item.status === "error";
  const uploading = item.status === "uploading";
  const showImage = Boolean(item.url) && !broken;

  // progress glides on a spring, so chunky upload events still read as one smooth climb
  const progress = useSpring(item.progress, { stiffness: 90, damping: 22 });
  React.useEffect(() => {
    if (reduceMotion) progress.jump(item.progress);
    else progress.set(item.progress);
  }, [item.progress, reduceMotion, progress]);

  const blur = useTransform(
    progress,
    (v) => `blur(${(1 - v) * 10}px) saturate(${0.5 + v * 0.5})`,
  );
  const zoom = useTransform(progress, [0, 1], [1.12, 1]);
  const percent = useTransform(progress, (v) => `${Math.round(v * 100)}%`);

  const remove = (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${item.file.name}`}
      className="absolute -right-1.5 -top-1.5 z-10 flex size-[18px] cursor-pointer items-center justify-center rounded-full bg-white text-neutral-600 opacity-0 shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_3px_rgb(0_0_0/0.12)] outline-none transition-[opacity,color,transform] duration-150 hover:text-neutral-900 active:scale-90 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black/20 [@media(hover:none)]:opacity-100 dark:bg-[#3A3A3E] dark:text-neutral-200 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_1px_3px_rgb(0_0_0/0.6)] dark:hover:text-white"
    >
      <CloseIcon />
    </button>
  );

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
      }
      transition={pop}
      className="group relative shrink-0"
    >
      {showImage ? (
        <div className="relative size-14 overflow-hidden rounded-[14px] bg-neutral-100 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:bg-[#2A2A2D] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
          <motion.img
            src={item.url}
            alt={item.file.name}
            draggable={false}
            onError={() => setBroken(true)}
            style={uploading ? { filter: blur, scale: zoom } : undefined}
            className="size-full object-cover"
          />
          {failed && (
            <button
              type="button"
              onClick={item.retryable ? onRetry : undefined}
              disabled={!item.retryable}
              aria-label={
                item.retryable ? `Retry ${item.file.name}` : item.error
              }
              title={item.error}
              className="absolute inset-0 flex cursor-pointer items-end justify-center bg-[#E5484D]/50 pb-1 text-[10px] font-semibold text-white disabled:cursor-default"
            >
              {item.retryable ? "Retry" : "Failed"}
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative flex h-14 w-[12.5rem] items-center gap-2.5 overflow-hidden rounded-[14px] bg-neutral-100/70 pl-3 pr-3.5 dark:bg-white/[0.05]",
            failed && "bg-[#E5484D]/[0.07] dark:bg-[#E5484D]/[0.1]",
          )}
        >
          <AnimatePresence>
            {uploading && (
              <motion.span
                aria-hidden="true"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ scaleX: progress }}
                className="absolute inset-0 origin-left bg-black/[0.045] dark:bg-white/[0.05]"
              />
            )}
          </AnimatePresence>
          <DocumentIcon ext={extension(item.file.name)} />
          <span className="relative flex min-w-0 flex-col gap-0.5">
            <FileName name={item.file.name} />
            <span
              className={cn(
                "truncate text-[11px] tabular-nums leading-tight",
                failed
                  ? "text-[#E5484D]"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              {failed ? (
                <>
                  {item.error}
                  {item.retryable && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={onRetry}
                        className="cursor-pointer font-medium underline-offset-2 outline-none hover:underline focus-visible:underline"
                      >
                        Retry
                      </button>
                    </>
                  )}
                </>
              ) : uploading ? (
                <>
                  Uploading <motion.span>{percent}</motion.span>
                </>
              ) : (
                formatSize(item.file.size)
              )}
            </span>
          </span>
        </div>
      )}
      {remove}
    </motion.li>
  );
}

function AttachmentTray({
  accept,
  maxFiles = 10,
  maxSize = 20 * 1024 * 1024,
  disabled = false,
  onUpload,
  onFilesChange,
  actions,
  className,
  children,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onPaste,
  onKeyDown,
  ...props
}: AttachmentTrayProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [items, setItems] = React.useState<Attachment[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const depth = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const urls = React.useRef(new Set<string>());
  const uploads = React.useRef(new Map<string, AbortController>());
  const latest = React.useRef(items);

  React.useEffect(() => {
    latest.current = items;
  }, [items]);

  React.useEffect(() => {
    const created = urls.current;
    const running = uploads.current;
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
      running.forEach((controller) => controller.abort());
    };
  }, []);

  const measureEdges = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges({
      start: list.scrollLeft > 1,
      end: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
    });
  }, []);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(measureEdges);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length, measureEdges]);

  const commit = (next: Attachment[]) => {
    latest.current = next;
    setItems(next);
    onFilesChange?.(
      next.filter((i) => i.status !== "error").map((i) => i.file),
    );
  };

  const update = (id: string, patch: Partial<Attachment>) =>
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const start = (item: Attachment) => {
    if (!onUpload) return;
    const controller = new AbortController();
    uploads.current.set(item.id, controller);
    onUpload(
      item.file,
      (p) => {
        if (!controller.signal.aborted)
          update(item.id, { progress: Math.min(1, Math.max(0, p)) });
      },
      controller.signal,
    )
      .then(() => {
        if (controller.signal.aborted) return;
        update(item.id, { progress: 1, status: "done" });
        setAnnouncement(`${item.file.name} uploaded`);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        update(item.id, {
          status: "error",
          error: "Upload failed",
          retryable: true,
        });
        setAnnouncement(`${item.file.name} failed to upload`);
      })
      .finally(() => uploads.current.delete(item.id));
  };

  const add = (files: FileList | File[]) => {
    if (disabled) return;
    const current = latest.current;
    const seen = new Set(current.map((i) => fingerprint(i.file)));
    let room = Math.max(
      0,
      maxFiles - current.filter((i) => i.status !== "error").length,
    );

    const added: Attachment[] = [];
    Array.from(files).forEach((file, i) => {
      const key = fingerprint(file);
      if (seen.has(key)) return;
      seen.add(key);

      const error =
        file.size === 0 && !file.type
          ? "Folders can't be attached"
          : file.size === 0
            ? "Empty file"
            : !accepts(file, accept)
              ? "File type not supported"
              : file.size > maxSize
                ? `Too large · max ${formatSize(maxSize)}`
                : room <= 0
                  ? `Limit is ${maxFiles} files`
                  : undefined;
      if (!error) room -= 1;

      const url =
        !error && file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;
      if (url) urls.current.add(url);
      added.push({
        id: `${key}:${Date.now()}:${i}`,
        file,
        url,
        error,
        progress: 0,
        status: error ? "error" : onUpload ? "uploading" : "done",
      });
    });
    if (added.length === 0) return;

    commit([...current, ...added]);
    added.filter((i) => i.status === "uploading").forEach(start);
    setAnnouncement(
      `${added.length} ${added.length === 1 ? "file" : "files"} added`,
    );

    requestAnimationFrame(() =>
      listRef.current?.scrollTo({
        left: listRef.current.scrollWidth,
        behavior: reduceMotion ? "auto" : "smooth",
      }),
    );
  };

  const remove = (id: string) => {
    const target = latest.current.find((i) => i.id === id);
    if (!target) return;
    uploads.current.get(id)?.abort();
    uploads.current.delete(id);
    if (target.url) {
      URL.revokeObjectURL(target.url);
      urls.current.delete(target.url);
    }
    commit(latest.current.filter((i) => i.id !== id));
    setAnnouncement(`${target.file.name} removed`);
  };

  const retry = (id: string) => {
    const target = latest.current.find((i) => i.id === id);
    if (!target) return;
    const fresh: Attachment = {
      ...target,
      status: "uploading",
      progress: 0,
      error: undefined,
      retryable: false,
    };
    update(id, fresh);
    start(fresh);
  };

  const hasFiles = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files");

  return (
    <div
      data-slot="attachment-tray"
      data-disabled={disabled || undefined}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (disabled || !hasFiles(event)) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (disabled || !hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (!hasFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        if (!hasFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        add(event.dataTransfer.files);
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (!disabled && event.clipboardData.files.length > 0) {
          event.preventDefault();
          add(event.clipboardData.files);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        const field = event.target as HTMLTextAreaElement | HTMLInputElement;
        // backspace in an empty input takes off the last file, like removing a token
        if (
          event.key === "Backspace" &&
          "value" in field &&
          field.value === "" &&
          field !== inputRef.current &&
          latest.current.length > 0
        ) {
          remove(latest.current[latest.current.length - 1].id);
        }
      }}
      className={cn(
        "relative flex w-full max-w-xl flex-col rounded-[24px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.05),0_1px_2px_rgb(0_0_0/0.04),0_2px_4px_-2px_rgb(0_0_0/0.03)] data-[disabled]:opacity-60 dark:bg-[#1E1E20] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),inset_0_0_0_1px_rgb(255_255_255/0.04),0_0_0_1px_rgb(0_0_0/0.6),0_1px_2px_rgb(0_0_0/0.5)]",
        className,
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {items.length > 0 && (
          <motion.div
            key="tray"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : settle}
            className="overflow-hidden"
          >
            <ul
              ref={listRef}
              aria-label="Attachments"
              onScroll={measureEdges}
              onWheel={(event) => {
                const list = listRef.current;
                if (!list || Math.abs(event.deltaY) <= Math.abs(event.deltaX))
                  return;
                list.scrollLeft += event.deltaY;
              }}
              className="flex items-center gap-2.5 overflow-x-auto px-3.5 pb-1 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                maskImage: `linear-gradient(90deg, ${edges.start ? "transparent" : "black"}, black 28px, black calc(100% - 28px), ${edges.end ? "transparent" : "black"})`,
              }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((item) => (
                  <Tile
                    key={item.id}
                    item={item}
                    reduceMotion={reduceMotion}
                    onRemove={() => remove(item.id)}
                    onRetry={() => retry(item.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {children}

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label="Attach files"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-neutral-500 outline-none transition-colors duration-150 hover:bg-black/[0.05] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-black/15 disabled:pointer-events-none dark:text-neutral-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
        >
          <PaperclipIcon />
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            if (event.target.files) add(event.target.files);
            event.target.value = "";
          }}
        />
        {actions}
      </div>

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-1 flex items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-neutral-300 bg-white/90 text-sm font-medium text-neutral-600 dark:border-white/20 dark:bg-[#1E1E20]/90 dark:text-neutral-300"
          >
            <PaperclipIcon />
            Drop to attach
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { AttachmentTray, type Attachment };
export default AttachmentTray;
