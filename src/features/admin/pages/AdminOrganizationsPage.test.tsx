import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { db } from "@/shared/mocks/db";
import { renderApp } from "@/test/render-app";

describe("AdminOrganizationsPage", () => {
  it("verifies a pending business (US6)", async () => {
    const { user } = await renderApp("/admin/organizations", { as: "user-admin" });
    expect(await screen.findByRole("tab", { name: "Pending 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Review Hilltop Kitchen" }));
    const panel = within(screen.getByRole("region", { name: "Review: Hilltop Kitchen" }));
    await user.click(panel.getByRole("button", { name: "Verify" }));
    expect(
      await screen.findByText("Hilltop Kitchen verified. The owner has been notified."),
    ).toBeInTheDocument();
    expect(db.organizations.find((o) => o.id === "org-hilltop")!.status).toBe("Verified");
  });

  it("requires a reason to reject", async () => {
    const { user } = await renderApp("/admin/organizations", { as: "user-admin" });
    await user.click(await screen.findByRole("button", { name: "Review Durbar Sweets" }));
    const panel = within(screen.getByRole("region", { name: "Review: Durbar Sweets" }));
    await user.click(panel.getByRole("button", { name: "Reject" }));
    const reason = panel.getByRole("textbox", { name: /Reason/ });
    expect(reason).toHaveAccessibleDescription(/A reason is required to reject/);
    expect(reason).toHaveFocus();

    await user.type(reason, "Address could not be confirmed.");
    await user.click(panel.getByRole("button", { name: "Reject" }));
    expect(
      await screen.findByText("Durbar Sweets rejected. The owner has been notified."),
    ).toBeInTheDocument();
  });
});
