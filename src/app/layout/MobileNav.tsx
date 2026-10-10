import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useSession } from "@/features/auth/session/session-context";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { getMainNavItems } from "./nav-items";

/**
 * Menu button and drawer for screens below md (768 px). Radix handles focus:
 * it moves into the drawer, stays there while open, closes on Escape and
 * returns to the menu button. Choosing a link closes the drawer.
 */
export function MobileNav() {
  const { user } = useSession();
  const items = getMainNavItems(user);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 max-w-[85vw]" aria-describedby={undefined}>
        <SheetTitle className="flex h-16 items-center border-b px-4 text-lg">Menu</SheetTitle>

        <nav aria-label="Mobile" className="px-2">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center rounded-md px-3 text-base font-medium transition-colors hover:bg-accent",
                      isActive && !item.to.includes("#") && "bg-primary-tint text-primary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {!user && (
          <div className="mt-auto flex flex-col gap-2 border-t p-4">
            <Button asChild>
              <Link to="/register" onClick={close}>
                Sign up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login" onClick={close}>
                Log in
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
