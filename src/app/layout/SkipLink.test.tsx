import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "@/app/router/routes";
import { SessionProvider } from "@/features/auth/session/SessionProvider";

describe("SkipLink", () => {
  it("is the first thing focused and moves focus to the main content", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(routes, { initialEntries: ["/browse"] });
    render(
      <SessionProvider initialUser={null}>
        <RouterProvider router={router} />
      </SessionProvider>,
    );
    await screen.findByRole("heading", { level: 1 });

    await user.tab();
    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    expect(skipLink).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(router.state.location.hash).toBe("");
  });
});
