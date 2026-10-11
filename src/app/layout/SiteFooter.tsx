import { Link } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import { clearMockStorage } from "@/shared/mocks/storage-keys";
import { Logo } from "@/shared/ui/logo";
import { getFooterNavItems } from "./nav-items";

const mocksOn = import.meta.env.VITE_USE_MOCKS !== "false";

/** Clears demo changes and the demo login, then starts again from the seed data. */
function resetDemoData() {
  clearMockStorage();
  window.location.assign("/");
}

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t bg-surface">
      <div className="page-container flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <Logo className="text-lg" />
          <p className="text-sm text-muted-foreground">
            Reserve surplus food nearby before it goes to waste.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:flex sm:gap-6">
            {getFooterNavItems(user).map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline md:min-h-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <div className="page-container flex flex-wrap items-center justify-between gap-2 py-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PlateBack. Built for the YuvaIntern programme.</p>
          {mocksOn && (
            <p>
              Demo data runs in your browser.{" "}
              <button
                type="button"
                onClick={resetDemoData}
                className="cursor-pointer font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Reset demo data
              </button>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
