"use client";

import AttachmentTray from "@/components/pro/attachment-tray";

// stands in for a real upload: ticks progress up over about a second and a half, and stops if cancelled
function fakeUpload(
  _file: File,
  report: (progress: number) => void,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 0.08 + Math.random() * 0.12;
      report(progress);
      if (progress >= 1) {
        window.clearInterval(timer);
        resolve();
      }
    }, 140);
    signal.addEventListener("abort", () => {
      window.clearInterval(timer);
      reject(signal.reason);
    });
  });
}

export default function AttachmentTrayDemo() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6">
      <AttachmentTray
        onUpload={fakeUpload}
        actions={
          <button
            type="button"
            aria-label="Send"
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white transition-transform duration-150 active:scale-95 dark:bg-white dark:text-neutral-900"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="size-4"
            >
              <path
                d="M10 15V5M5.5 9.5 10 5l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        }
      >
        <textarea
          rows={2}
          placeholder="Ask anything, or drop a file here"
          className="w-full resize-none bg-transparent px-5 pb-2 pt-4 text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
        />
      </AttachmentTray>
      <p className="text-sm text-foreground/50">
        Drop a file, paste one, or click the paperclip.
      </p>
    </div>
  );
}
