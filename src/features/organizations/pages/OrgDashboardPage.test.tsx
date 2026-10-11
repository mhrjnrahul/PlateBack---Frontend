import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("OrgDashboardPage", () => {
  it("shows KPIs, listings and today's queue", async () => {
    await renderApp("/org/org-sunrise", { as: "user-arjun" });
    expect(await screen.findByText("Portions reserved")).toBeInTheDocument();
    const table = within(await screen.findByRole("table", { name: "Your listings" }));
    expect(table.getByRole("rowheader", { name: "Mixed pastry box" })).toBeInTheDocument();
    const queue = within(screen.getByRole("region", { name: "Reservations for today" }));
    expect(await queue.findByText("Maya Rai")).toBeInTheDocument();
  });

  it("verifies a pickup code at the counter (US4)", async () => {
    const { user } = await renderApp("/org/org-sunrise", { as: "user-arjun" });
    const input = await screen.findByRole("textbox", { name: "Customer's pickup code" });
    await user.type(input, "k7m29qxa");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Collected: hand over the food");
    expect(status).toHaveTextContent("Maya Rai · Mixed pastry box × 1");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("rejects an unknown code and changes nothing", async () => {
    const { user } = await renderApp("/org/org-sunrise", { as: "user-arjun" });
    await user.type(
      await screen.findByRole("textbox", { name: "Customer's pickup code" }),
      "AAAA-BBBB",
    );
    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No reservation with this code for your organization.",
    );
  });

  it("explains that a pending business must wait for verification (US3)", async () => {
    await renderApp("/org/org-hilltop", { as: "user-ramesh" });
    expect(await screen.findByText("Waiting for verification")).toBeInTheDocument();
    // No publishing tools on the dashboard until verified
    expect(
      within(screen.getByRole("main")).queryByRole("link", { name: "New listing" }),
    ).not.toBeInTheDocument();
  });
});
