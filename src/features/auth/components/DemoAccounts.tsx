/** Seeded accounts for trying each role with the mock API (password123). */
const DEMO_ACCOUNTS = [
  { label: "Customer", name: "Maya Rai", email: "maya@example.com" },
  { label: "Business owner", name: "Arjun, Sunrise Bakery", email: "arjun@sunrisebakery.example" },
  { label: "Admin", name: "Platform Admin", email: "admin@plateback.example" },
];

export const DEMO_PASSWORD = "password123";

/** Shown while the app runs on the mock API, so reviewers can try every role. */
export function DemoAccounts({ onPick }: { onPick: (email: string) => void }) {
  return (
    <section
      aria-labelledby="demo-accounts"
      className="rounded-lg border border-dashed bg-surface p-4"
    >
      <h2 id="demo-accounts" className="text-sm font-semibold">
        Demo accounts
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Password for all: <code className="font-mono">{DEMO_PASSWORD}</code>
      </p>
      <ul className="mt-3 space-y-1">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              onClick={() => onPick(account.email)}
              className="flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-md px-3 text-left text-sm hover:bg-background md:min-h-9"
            >
              <span className="font-semibold">{account.label}</span>{" "}
              <span className="text-muted-foreground">{account.email}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
