import { ChevronDown, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/features/auth/session/auth-context";
import type { CurrentUser } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { toast } from "@/shared/ui/toaster";
import { getAccountMenuItems } from "./nav-items";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Avatar button that opens the account menu. */
export function AccountMenu({ user }: { user: CurrentUser }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogOut() {
    await logout();
    navigate("/");
    toast("You are logged out.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-1 px-1.5"
          aria-label={`Account menu for ${user.displayName}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary"
          >
            {initials(user.displayName)}
          </span>
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="font-semibold">{user.displayName}</p>
          <p className="truncate text-muted-foreground">{user.email}</p>
          {user.memberships[0] && (
            <p className="mt-1 text-muted-foreground">{user.memberships[0].organizationName}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {getAccountMenuItems(user).map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link to={item.to}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleLogOut()}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
