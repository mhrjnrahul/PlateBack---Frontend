import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers/AppProviders";
import { routes } from "@/app/router/routes";
import { SESSION_HINT_KEY } from "@/features/auth/session/AuthProvider";
import { MOCK_SESSION_KEY } from "@/shared/mocks/storage-keys";

/** Seeded users (password "password123"), see src/shared/mocks/data/seed.ts. */
export type DemoUser =
  "user-maya" | "user-arjun" | "user-bikash" | "user-admin" | "user-binod" | "user-ramesh";

/**
 * Renders the whole app at `path`, against the mock API. With `as`, the user
 * is signed in through the real session restore (POST /auth/refresh).
 */
export async function renderApp(path = "/", { as }: { as?: DemoUser } = {}) {
  if (as) {
    localStorage.setItem(MOCK_SESSION_KEY, as);
    localStorage.setItem(SESSION_HINT_KEY, "1");
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  // Every page has exactly one h1 once it has loaded.
  await screen.findByRole("heading", { level: 1 }, { timeout: 3000 });
  return { router, user };
}
