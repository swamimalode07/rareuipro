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
