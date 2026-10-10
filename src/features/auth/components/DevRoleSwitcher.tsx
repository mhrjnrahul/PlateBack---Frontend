import { devUsers } from "@/features/auth/session/dev-users";
import { useSession, type NavRole } from "@/features/auth/session/session-context";

const options: { value: NavRole; label: string }[] = [
  { value: "visitor", label: "Visitor (signed out)" },
  { value: "customer", label: "Customer" },
  { value: "business", label: "Business staff" },
  { value: "admin", label: "Admin" },
];

/**
 * Development-only control to view the app as each role before login exists.
 * Rendered only when import.meta.env.DEV is true; removed in step 9.
 */
export function DevRoleSwitcher() {
  const { navRole, signInAs, signOut } = useSession();

  function handleChange(role: NavRole) {
    if (role === "visitor") signOut();
    else signInAs(devUsers[role]);
  }

  return (
    <div className="fixed bottom-3 left-16 z-50 flex items-center gap-2 rounded-full border bg-background/95 py-1 pr-1 pl-3 text-xs shadow-md">
      <label htmlFor="dev-role-switcher" className="font-semibold text-muted-foreground">
        Dev: view as
      </label>
      <select
        id="dev-role-switcher"
        value={navRole}
        onChange={(event) => handleChange(event.target.value as NavRole)}
        className="h-8 cursor-pointer rounded-full border border-input bg-background px-2 text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
