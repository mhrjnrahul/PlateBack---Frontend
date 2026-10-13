import { Link } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";

/** Signed in, but this page is for another role or organization. */
export function ForbiddenPage() {
  usePageTitle("No access");
  return (
    <div className="page-container py-16 text-center md:py-24">
      <p className="text-sm font-semibold text-primary">403</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        You don't have access to this page
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        This page belongs to another role or business. If you think this is a mistake, contact the
        business owner.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/browse">Browse listings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
