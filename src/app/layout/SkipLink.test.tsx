import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("SkipLink", () => {
  it("is the first thing focused and moves focus to the main content", async () => {
    const { user, router } = await renderApp("/browse");
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(router.state.location.hash).toBe("");
  });
});
