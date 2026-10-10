import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Button } from "@/shared/ui/button";

/**
 * Shown when a page throws or its code fails to load (for example after a
 * new deployment). The error details go to the console, not the screen.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  console.error(error);
  usePageTitle("Error");

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";

  return (
    <div role="alert" className="page-container py-16 text-center md:py-24">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        This page could not be shown. Reloading usually fixes it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Reload page</Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
