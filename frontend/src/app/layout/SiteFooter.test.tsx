import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("SiteFooter", () => {
  it("keeps the demo reset inside a Demo tools dialog", async () => {
    const { user } = await renderApp("/browse");
    expect(screen.queryByRole("button", { name: "Reset demo data" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Demo tools" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Demo tools" }));
    expect(dialog.getByRole("button", { name: "Reset demo data" })).toBeInTheDocument();
  });
});
