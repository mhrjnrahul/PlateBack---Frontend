import { Link } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";

/** Placeholder form page; the real form is built in step 9. */
export function LoginPage() {
  usePageTitle("Log in");

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back. Log in to reserve food and see your pickup codes.
      </p>
      <p className="mt-6 rounded-xl border border-dashed border-input bg-surface p-4 text-sm text-muted-foreground">
        The form is built in step 9 of the frontend plan.
      </p>
      <p className="mt-6 text-sm">
        <Link
          to="/"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}
