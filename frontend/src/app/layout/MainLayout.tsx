import { Outlet, ScrollRestoration } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { useHtmlFlag } from "@/shared/hooks/use-html-flag";
import { MobileTabBar } from "./MobileTabBar";
import { getTabItems } from "./nav-items";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

/** Layout for every page except login and register. */
export function MainLayout() {
  const { user } = useAuth();
  useHtmlFlag("data-tab-bar", getTabItems(user).length > 0);

  return (
    // Room for the fixed bars at the bottom on mobile (see --tab-bar in index.css)
    <div className="flex min-h-dvh flex-col pb-[calc(var(--tab-bar)+var(--bottom-bar))]">
      <SkipLink />
      <SiteHeader />
      {/* tabIndex lets the skip link move focus here */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
      <ScrollRestoration />
    </div>
  );
}
