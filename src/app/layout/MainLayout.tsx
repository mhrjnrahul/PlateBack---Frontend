import { Outlet, ScrollRestoration } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { cn } from "@/shared/lib/utils";
import { MobileTabBar } from "./MobileTabBar";
import { getTabItems } from "./nav-items";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

/** Layout for every page except login and register. */
export function MainLayout() {
  const { user } = useAuth();
  // Leave room for the fixed tab bar on mobile so it never covers the footer.
  const hasTabBar = getTabItems(user).length > 0;

  return (
    <div className={cn("flex min-h-dvh flex-col", hasTabBar && "pb-16 md:pb-0")}>
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
