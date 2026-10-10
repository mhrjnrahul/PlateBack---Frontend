import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { MainNav } from "./MainNav";
import { visitorNavItems } from "./nav-items";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="page-container flex h-16 items-center gap-6">
        <Link to="/" className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <MainNav items={visitorNavItems} />

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/register">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
