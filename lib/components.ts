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
    name: "Light Beam Card",
    href: "/components/lightbeamcard",
    category: "display",
    registry: "light-beam-card",
    isNew: true,
    featured: true,
    description:
      "A card lit by a warm beam of light that pours in from one corner.",
    dependencies: [{ name: "motion" }],
    interaction:
      "A soft beam of light rises from the bottom corner, cut by fine strands. Move the pointer across the card and the beam sways to follow it, then settles back when the pointer leaves.",
    props: [
      {
        name: "color",
        type: "string",
        default: '"#FC4C01"',
        control: "swatch",
        options: ["#FC4C01", "#3B82F6", "#22C55E", "#A855F7"],
        optionColors: {
          "#FC4C01": "#FC4C01",
          "#3B82F6": "#3B82F6",
          "#22C55E": "#22C55E",
          "#A855F7": "#A855F7",
        },
        description: "The colour of the beam. Any CSS colour works.",
      },
      {
        name: "strands",
        type: "boolean",
        default: "true",
        description: "Draws the fine hairlines that run along the beam.",
      },
      {
        name: "intensity",
        type: "number",
        default: "1",
        description: "How strong the light is, from 0 to 1.",
      },
    ],
    usage: `import LightBeamCard from "@/components/ui/light-beam-card";

export default function Pricing() {
  return (
    <LightBeamCard className="max-w-sm">
      <p className="text-6xl font-bold">$199</p>
    </LightBeamCard>
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
