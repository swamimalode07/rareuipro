import type { ReactNode } from "react";

export type Dependency = {
  name: string;
  icon?: ReactNode;
};

export type ComponentProp = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  options?: string[];
  control?: "swatch";
  optionColors?: Record<string, string>;
  description: string;
};

export type ComponentCategory =
  | "ai"
  | "navigation"
  | "inputs"
  | "feedback"
  | "display";

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  ai: "AI kit",
  navigation: "Navigation",
  inputs: "Inputs",
  feedback: "Feedback",
  display: "Display",
};

export const CATEGORY_ORDER: ComponentCategory[] = [
  "display",
  "ai",
  "navigation",
  "inputs",
  "feedback",
];

export type ComponentItem = {
  name: string;
  href: string;
  category: ComponentCategory;
  isNew?: boolean;
  description?: string;
  registry?: string;
  source?: string;
  preview?: string;
  previewScale?: number;
  featured?: boolean;
  dependencies?: Dependency[];
  interaction?: string;
  usage?: string;
  props?: ComponentProp[];
  credits?: string[];
};

export const REGISTRY_NAMESPACE = "@rareui-pro";

export const PANEL_INFO = {
  sourceHint:
    "Click the code icon in the top-right corner to view the source code.",
  keepInMind:
    "Most components here are recreations of great work from around the web. I don't claim to be the original creator - this is my attempt to reverse-engineer, replicate, and often add a few extra features. I've tried to credit everyone; if I missed someone, let me know.",
  contactEmail: "swamimalodeofficial@gmail.com",
  contactNote: "Found a bug or issue? Feel free to drop a DM.",
  license: [
    "Licensed to RareUI Pro holders for use in their own personal and commercial projects, closed source included.",
    "Don't sell, sublicense, share or redistribute the components themselves, on their own or bundled into a template, kit, theme or course.",
    "Don't republish them or repackage them as a competing component library.",
    "The full Pro license governs. Ask first if your use doesn't fit these rules.",
  ],
} as const;

export const components: ComponentItem[] = [
  {
    name: "Attachment Tray",
    href: "/components/attachmenttray",
    category: "ai",
    registry: "attachment-tray",
    isNew: true,
    featured: true,
    description: "A prompt box that takes files, with thumbnails and upload progress.",
    dependencies: [{ name: "motion" }],
    interaction:
      "Drop files anywhere on the box, paste them, or click the paperclip. Images sharpen into focus as they upload, and other files fill up as a soft bar. Remove one and the rest slide over; press Backspace in an empty input to remove the last. Duplicates are skipped, and files that are too big, empty or the wrong type say why. A failed upload can be retried.",
    props: [
      {
        name: "onUpload",
        type: "(file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<void>",
        description: "Uploads one file. Call report with a number from 0 to 1 to move its progress, and reject to mark it failed. The signal aborts if the file is removed mid-upload.",
      },
      {
        name: "onFilesChange",
        type: "(files: File[]) => void",
        description: "Called with the current files whenever one is added or removed.",
      },
      {
        name: "accept",
        type: "string",
        description: "The file types the picker allows, like image/*,.pdf.",
      },
      {
        name: "maxFiles",
        type: "number",
        default: "10",
        description: "How many files can be attached. Extra ones show as an error.",
      },
      {
        name: "maxSize",
        type: "number",
        default: "20971520",
        description: "The largest file allowed, in bytes. The default is 20 MB.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "Shown on the right of the bottom row, like a send button.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Stops files from being added.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "The input that sits under the files, usually a textarea.",
      },
    ],
    usage: `import AttachmentTray from "@/components/ui/attachment-tray";

export default function Composer() {
  return (
    <AttachmentTray
      onUpload={async (file, report, signal) => {
        // upload the file with fetch(url, { signal }), calling report(0.5) and so on as it goes
        report(1);
      }}
      actions={<button>Send</button>}
    >
      <textarea placeholder="Ask anything" className="w-full resize-none bg-transparent px-5 pt-4 outline-none" />
    </AttachmentTray>
  );
}`,
  },
  {
    name: "Notification Menu",
    href: "/components/notificationmenu",
    category: "feedback",
    registry: "notification-menu",
    isNew: true,
    featured: true,
    description: "A bell with an unread count that opens a list of notifications.",
    dependencies: [{ name: "motion" }],
    interaction:
      "The badge shows how many notifications are unread, and the bell swings when a new one arrives. Click the bell and the list grows out of it. Click a notification to mark it read, or mark them all at once, and the count rolls down. Click outside or press Escape and it folds back into the bell.",
    props: [
      {
        name: "notifications",
        type: "{ id: string; title: string; body?: string; time: string; read?: boolean; avatar?: ReactNode }[]",
        required: true,
        description: "The list to show. Add a new item and the bell swings. Without an avatar, the initials of the title are used.",
      },
      {
        name: "heading",
        type: "string",
        default: '"Notifications"',
        description: "The title at the top of the list.",
      },
      {
        name: "emptyText",
        type: "string",
        default: '"You\'re all caught up."',
        description: "Shown when there are no notifications.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        default: '"center"',
        description: "Where the list sits under the bell. Centered by default.",
      },
      {
        name: "onRead",
        type: "(id: string) => void",
        description: "Called when a notification is marked read.",
      },
      {
        name: "onReadAll",
        type: "() => void",
        description: "Called when every notification is marked read.",
      },
    ],
    usage: `import NotificationMenu from "@/components/ui/notification-menu";

export default function Header() {
  return (
    <NotificationMenu
      notifications={[
        { id: "1", title: "Maya Chen", body: "Left a comment on Pricing.", time: "2m" },
        { id: "2", title: "Deploy finished", body: "main is live.", time: "18m", read: true },
      ]}
      onRead={(id) => console.log("read", id)}
    />
  );
}`,
  },
  {
    name: "Receipt",
    href: "/components/receipt",
    category: "display",
    registry: "receipt",
    isNew: true,
    featured: true,
    description: "A paper receipt that prints out of a small printer, line by line.",
    dependencies: [{ name: "motion" }],
    interaction:
      "When the receipt scrolls into view it feeds out of the slot in short pulses, like a real thermal printer, while the light on the printer glows. Press the button on the printer to print it again.",
    props: [
      {
        name: "items",
        type: "{ label: string; price: number; qty?: number; note?: string }[]",
        required: true,
        description: "The lines on the receipt. Subtotal, tax and total are worked out from these.",
      },
      {
        name: "merchant",
        type: "{ name: string; address?: string; logo?: ReactNode }",
        description: "The header at the top of the paper.",
      },
      {
        name: "title",
        type: "string",
        default: '"Payment successful"',
        description: "The small heading above the total.",
      },
      {
        name: "meta",
        type: "string[]",
        description: "Short lines under the total, like the date and card.",
      },
      {
        name: "adjustments",
        type: "{ label: string; amount: number }[]",
        description: "Extra lines added before tax, like a discount (negative) or a tip.",
      },
      {
        name: "tax",
        type: "{ label?: string; rate: number }",
        description: "The tax line. A rate of 0.05 is 5%. Leave it out for no tax.",
      },
      {
        name: "currency",
        type: "string",
        default: '"USD"',
        description: "The ISO currency code used to format every amount.",
      },
      {
        name: "locale",
        type: "string",
        default: '"en-US"',
        description: "The locale used to format amounts.",
      },
      {
        name: "formatAmount",
        type: "(value: number) => string",
        description: "Your own amount formatter. Overrides currency and locale.",
      },
      {
        name: "stamp",
        type: "string",
        default: '"Paid"',
        description: "The word in the round stamp. Pass an empty string to hide it.",
      },
      {
        name: "footer",
        type: "string",
        default: '"Thank you"',
        description: "The note at the bottom of the paper.",
      },
      {
        name: "barcode",
        type: "string",
        description: "Draws a barcode with this value under the footer.",
      },
      {
        name: "paperColor",
        type: "string",
        default: '"#FAF9F6"',
        description: "The colour of the paper.",
      },
      {
        name: "inkColor",
        type: "string",
        default: '"#262522"',
        description: "The colour of the printed text.",
      },
      {
        name: "duration",
        type: "number",
        default: "2.4",
        description: "How long the print takes, in seconds.",
      },
      {
        name: "printer",
        type: "boolean",
        default: "true",
        description: "Shows the printer. Without it the receipt renders as plain paper.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Extra content printed under the total.",
      },
    ],
    usage: `import Receipt from "@/components/ui/receipt";

export default function Checkout() {
  return (
    <Receipt
      merchant={{ name: "Corner Café" }}
      meta={["27 Nov 2026", "Card ···· 4242"]}
      items={[
        { label: "Flat white", price: 4.5, qty: 2 },
        { label: "Banana bread", price: 3.25 },
      ]}
      tax={{ label: "VAT", rate: 0.05 }}
      currency="GBP"
      locale="en-GB"
    />
  );
}`,
  },
  {
    name: "Chip Wheel",
    href: "/components/chipwheel",
    category: "display",
    registry: "chip-wheel",
    isNew: true,
    featured: true,
    description: "A rolling wheel of pills that sits inside a line of text.",
    dependencies: [{ name: "motion" }],
    interaction:
      "Pills roll up one at a time like a picker wheel. The one in the middle faces you, and the ones above and below tip back and fade into the background. The text beside it stays still. Hover to pause.",
    props: [
      {
        name: "items",
        type: "{ label: string; icon?: ReactNode; color?: string }[]",
        required: true,
        description: "The pills to cycle through. The color tints the label and fills the icon circle.",
      },
      {
        name: "interval",
        type: "number",
        default: "2200",
        description: "Time each pill stays in the middle, in milliseconds.",
      },
      {
        name: "paused",
        type: "boolean",
        default: "false",
        description: "Stops the wheel on the current pill.",
      },
    ],
    usage: `import ChipWheel from "@/components/ui/chip-wheel";
import { Mail, Music2 } from "lucide-react";

export default function Headline() {
  return (
    <h2 className="flex items-center gap-2 text-5xl font-bold">
      <ChipWheel
        items={[
          { label: "Music", icon: <Music2 />, color: "#1FAF5A" },
          { label: "Mail", icon: <Mail />, color: "#2F80ED" },
        ]}
      />
      in one place
    </h2>
  );
}`,
  },
  {
    name: "Folder",
    href: "/components/folder",
    category: "display",
    registry: "folder",
    isNew: true,
    featured: true,
    description: "A soft folder with a few cards peeking out of the top.",
    dependencies: [{ name: "motion" }],
    interaction:
      "Hover the folder and the front flap folds forward while the cards rise and fan out, one after another from the middle. The folder tilts gently toward your pointer and presses in when clicked. Move away and the cards tuck back in from the edges. On touch screens, tap to open and tap again to close.",
    props: [
      {
        name: "color",
        type: "string",
        default: '"#8C9BFF"',
        control: "swatch",
        options: ["#8C9BFF", "#F2F2F4", "#FFD25E", "#F5A3C7", "#7FD1AE"],
        optionColors: {
          "#8C9BFF": "#8C9BFF",
          "#F2F2F4": "#F2F2F4",
          "#FFD25E": "#FFD25E",
          "#F5A3C7": "#F5A3C7",
          "#7FD1AE": "#7FD1AE",
        },
        description: "The colour of the folder. The back panel is drawn a shade darker.",
      },
      {
        name: "items",
        type: "ReactNode[]",
        description: "What goes inside each card. Every item gets a white squircle frame. Three or four look best.",
      },
      {
        name: "label",
        type: "string",
        description: "The name shown under the folder.",
      },
      {
        name: "caption",
        type: "string",
        description: "A second line under the label.",
      },
      {
        name: "count",
        type: "number",
        description: "Shows a number in a pill on the front of the folder.",
      },
      {
        name: "countLabel",
        type: "string",
        description: "A word after the number that says what it counts, like fonts.",
      },
      {
        name: "open",
        type: "boolean",
        description: "Holds the folder open or closed. Leave it unset to open on hover.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Content drawn on the front flap.",
      },
    ],
    usage: `import Folder from "@/components/ui/folder";

export default function Library() {
  return (
    <Folder
      label="Fonts"
      count={136}
      countLabel="fonts"
      items={[
        <div key="a" className="size-full bg-amber-300" />,
        <div key="b" className="size-full bg-rose-400" />,
        <div key="c" className="size-full bg-pink-300" />,
      ]}
    />
  );
}`,
  },
];

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const PM_EXECUTORS: Record<PackageManager, string> = {
  npm: "npx",
  pnpm: "pnpm dlx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

export const PACKAGE_MANAGERS = Object.keys(PM_EXECUTORS) as PackageManager[];

export function installCommand(
  item: ComponentItem,
  pm: PackageManager = "npm",
): string | null {
  if (!item.registry) return null;
  // @latest matters: npx otherwise picks a stale local shadcn without namespaced registries
  return `${PM_EXECUTORS[pm]} shadcn@latest add ${REGISTRY_NAMESPACE}/${item.registry}`;
}

export type ComponentSection = {
  id: string;
  label: string;
  items: ComponentItem[];
};

// gallery sections: New repeats its members so they still appear under their own category
export const gallerySections: ComponentSection[] = [
  {
    id: "new",
    label: "New releases",
    items: components.filter((c) => c.isNew).reverse(),
  },
  ...CATEGORY_ORDER.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    items: components.filter((c) => c.category === id),
  })),
].filter((section) => section.items.length > 0);

export function activeComponent(pathname: string): ComponentItem | undefined {
  return components.find((c) => c.href === pathname);
}

export function registryComponent(name: string): ComponentItem | undefined {
  return components.find((c) => c.registry === name);
}

export function swatchProp(item?: ComponentItem): ComponentProp | undefined {
  return item?.props?.find((p) => p.control === "swatch" && p.optionColors);
}

export function cleanDefault(prop?: ComponentProp): string | undefined {
  return prop?.default?.replace(/^["']|["']$/g, "");
}
