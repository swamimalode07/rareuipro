import type { Metadata } from "next";
import Footer from "@/components/Footer";
import GooeyNavbar from "@/components/GooeyNavbar";
import TemplateGallery from "@/components/templates/TemplateGallery";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Full-page Rare UI Pro templates built from the same animated components. Install them with the shadcn CLI.",
  alternates: {
    canonical: "/templates",
  },
};

export default function TemplatesPage() {
  return (
    <>
      <GooeyNavbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-32 sm:px-6 md:pt-40">
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-balance font-runde text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
            Whole pages,
            <br />
            <span className="text-black/40 dark:text-white/45">
              made to feel rare.
            </span>
          </h1>
          <p className="max-w-lg text-balance text-sm font-medium text-muted-foreground sm:text-base">
            Full templates built from the same components, ready to drop into
            your app with the shadcn CLI.
          </p>
        </header>

        <TemplateGallery />
      </main>

      <Footer />
    </>
  );
}
