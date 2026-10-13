import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** Seeded accounts for trying each role with the mock API (password123). */
const DEMO_ACCOUNTS = [
  { label: "Customer", email: "maya@example.com" },
  { label: "Business owner", email: "arjun@sunrisebakery.example" },
  { label: "Admin", email: "admin@plateback.example" },
];

export const DEMO_PASSWORD = "password123";

/**
 * Shown while the app runs on the mock API, so reviewers can try every role.
 * Collapsed by default so it does not compete with the real form.
 */
export function DemoAccounts({ onPick }: { onPick: (email: string) => void }) {
  return (
    <details className="group rounded-md border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-open:rotate-90"
        />
        Try a demo account
      </summary>
      <div className="border-t px-3 pt-2 pb-3">
        <p className="text-sm text-muted-foreground">
          The password is filled in for you ({DEMO_PASSWORD}).
        </p>
        <ul className="mt-2 divide-y">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 text-sm">
                <span className="block font-semibold">{account.label}</span>
                <span className="block truncate text-muted-foreground">{account.email}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPick(account.email)}
                aria-label={`Fill in ${account.label} account`}
              >
                Fill in
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
