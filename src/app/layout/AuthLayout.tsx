import { Link, Outlet, ScrollRestoration } from "react-router";
import { Logo } from "@/shared/ui/logo";
import { SkipLink } from "./SkipLink";

/** Login and register: logo and a centred card, no site navigation. */
export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SkipLink />
      <header className="page-container flex h-16 items-center">
        <Link to="/" className="rounded-md">
          <Logo />
        </Link>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 py-10 focus:outline-none sm:items-center"
      >
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  );
}
