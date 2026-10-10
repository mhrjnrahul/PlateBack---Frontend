import type { ReactNode } from "react";
import { usePageTitle } from "@/shared/hooks/use-page-title";

type PlaceholderPageProps = {
  title: string;
  description: string;
  /** Plan step that builds the real page */
  step: number;
  children?: ReactNode;
};

/**
 * Temporary page used until the real one is built.
 */
export function PlaceholderPage({ title, description, step, children }: PlaceholderPageProps) {
  usePageTitle(title);

  return (
    <div className="page-container py-10 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      {children}
      <p className="mt-8 rounded-xl border border-dashed border-input bg-surface p-6 text-sm text-muted-foreground">
        This page is a placeholder. Its content is built in step {step} of the frontend plan.
      </p>
    </div>
  );
}
