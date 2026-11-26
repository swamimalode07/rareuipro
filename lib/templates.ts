export type TemplateCategory = "Landing" | "SaaS" | "Portfolio" | "Agency";

export type TemplateItem = {
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  // a full-page screenshot; cards scroll through it on hover
  image: string;
  previewUrl?: string;
};

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Landing", "SaaS", "Portfolio", "Agency"];

// placeholder entries so the layout can be designed; replace with real templates as they ship
const PLACEHOLDER = "/templates/placeholder-full.jpg";

export const templates: TemplateItem[] = [
  { name: "Bloom", slug: "bloom", category: "Landing", image: PLACEHOLDER, previewUrl: "/", description: "A product launch page with a shader hero, testimonials and pricing." },
  { name: "Ledger", slug: "ledger", category: "SaaS", image: PLACEHOLDER, previewUrl: "/", description: "Marketing site for a SaaS product with feature tours and a changelog." },
  { name: "Folio", slug: "folio", category: "Portfolio", image: PLACEHOLDER, previewUrl: "/", description: "A personal portfolio with animated case studies and a contact sheet." },
  { name: "Studio", slug: "studio", category: "Agency", image: PLACEHOLDER, previewUrl: "/", description: "An agency site with a work grid, services and a team page." },
  { name: "Signal", slug: "signal", category: "Landing", image: PLACEHOLDER, previewUrl: "/", description: "A waitlist page with a countdown and a single sign-up form." },
  { name: "Atlas", slug: "atlas", category: "SaaS", image: PLACEHOLDER, previewUrl: "/", description: "Docs-style site with a sidebar, search and code samples." },
];
