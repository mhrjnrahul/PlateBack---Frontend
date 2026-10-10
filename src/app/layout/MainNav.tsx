import { NavLink } from "react-router";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "./nav-items";

/**
 * Desktop navigation (md and up). NavLink sets aria-current="page" on the
 * active link; links to a section of the landing page (with #) are never
 * marked active, because they share the "/" path.
 */
export function MainNav({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Main" className="hidden h-full md:block">
      <ul className="flex h-full items-center gap-1">
        {items.map((item) => (
          <li key={item.to} className="flex h-full items-center">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative flex h-10 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive &&
                    !item.to.includes("#") &&
                    // underline sits on the header's bottom edge: (64 px header - 40 px link) / 2 = 12 px
                    "font-semibold text-foreground after:absolute after:inset-x-3 after:-bottom-3 after:h-0.5 after:rounded-full after:bg-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
