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

export const templates: TemplateItem[] = [];
