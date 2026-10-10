import { ChevronDown, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { SessionUser } from "@/features/auth/session/session-context";
import { useSession } from "@/features/auth/session/session-context";
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
export function AccountMenu({ user }: { user: SessionUser }) {
  const { signOut } = useSession();
  const navigate = useNavigate();

  function handleLogOut() {
    signOut();
    navigate("/");
    toast("You are logged out.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-1 px-1.5"
          aria-label={`Account menu for ${user.name}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary"
          >
            {initials(user.name)}
          </span>
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="font-semibold">{user.name}</p>
          <p className="truncate text-muted-foreground">{user.email}</p>
          {user.organization && (
            <p className="mt-1 text-muted-foreground">{user.organization.name}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {getAccountMenuItems(user).map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link to={item.to}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogOut}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
