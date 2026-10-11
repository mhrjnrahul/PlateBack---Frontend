import { Link, Outlet, ScrollRestoration } from "react-router";
import { Logo } from "@/shared/ui/logo";
import { SkipLink } from "./SkipLink";

/** Login and register: one centred column with the logo above, no site navigation. */
export function AuthLayout() {
  return (
    <div className="min-h-dvh">
      <SkipLink />
      <div className="mx-auto w-full max-w-sm px-4 py-10 sm:py-16">
        <header className="mb-10">
          <Link to="/" className="inline-block rounded-md">
            <Logo className="text-xl" />
          </Link>
        </header>
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
