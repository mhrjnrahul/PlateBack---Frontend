import { Outlet, ScrollRestoration } from "react-router";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

/** Layout for every page except login and register. */
export function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      {/* tabIndex lets the skip link move focus here */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
