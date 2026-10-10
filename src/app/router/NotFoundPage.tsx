import { Link } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <div className="page-container py-16 text-center md:py-24">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has moved.
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
