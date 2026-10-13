import { Link } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { AccountMenu } from "./AccountMenu";
import { MainNav } from "./MainNav";
import { MobileNav } from "./MobileNav";
import { getMainNavItems } from "./nav-items";
import { NotificationsButton } from "./NotificationsButton";

export function SiteHeader() {
  const { user, status } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="page-container flex h-16 items-center gap-6">
        <Link to="/" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <MainNav items={getMainNavItems(user)} />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {status === "loading" ? (
            // Keeps the header from flashing "Log in" while the session is restored
            <span className="h-10 w-24" aria-hidden="true" />
          ) : user ? (
            <>
              <NotificationsButton />
              <AccountMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
