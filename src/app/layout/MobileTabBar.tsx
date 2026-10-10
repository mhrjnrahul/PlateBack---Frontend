import { NavLink } from "react-router";
import { useSession } from "@/features/auth/session/session-context";
import { cn } from "@/shared/lib/utils";
import { getTabItems } from "./nav-items";

/** Bottom tab bar on screens below md (wireframes M1-M6). */
export function MobileTabBar() {
  const { user } = useSession();
  const tabs = getTabItems(user);
  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 auto-cols-fr grid-flow-col">
        {tabs.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors",
                  isActive && "font-semibold text-primary",
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
