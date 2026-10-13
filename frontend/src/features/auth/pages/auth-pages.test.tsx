import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

describe("LoginPage", () => {
  it("shows an error for a wrong password", async () => {
    const { user } = await renderApp("/login");
    await user.type(screen.getByRole("textbox", { name: /Email/ }), "maya@example.com");
    await user.type(screen.getByLabelText(/Password/), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it("logs in with a demo account and returns to the page that asked", async () => {
    const { user, router } = await renderApp("/login?redirect=%2Fme%2Freservations");
    await user.click(screen.getByText("Try a demo account"));
    await user.click(screen.getByRole("button", { name: "Fill in Customer account" }));
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "My reservations" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/me/reservations");
  });

  it("ignores redirects to other sites", async () => {
    const { user, router } = await renderApp("/login?redirect=%2F%2Fevil.example");
    await user.click(screen.getByText("Try a demo account"));
    await user.click(screen.getByRole("button", { name: "Fill in Customer account" }));
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/browse"));
  });
});

describe("RegisterPage", () => {
  it("creates an account and continues to business details from 'List your surplus'", async () => {
    const { user, router } = await renderApp("/register?next=business");
    await user.type(screen.getByRole("textbox", { name: /Your name/ }), "Asha Karki");
    await user.type(screen.getByRole("textbox", { name: /Email/ }), "asha@example.com");
    await user.type(screen.getByLabelText(/Password/), "longpassword");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "List your business" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/org/new");
  });

  it("shows the server's error next to the email field", async () => {
    const { user } = await renderApp("/register");
    await user.type(screen.getByRole("textbox", { name: /Your name/ }), "Maya");
    await user.type(screen.getByRole("textbox", { name: /Email/ }), "maya@example.com");
    await user.type(screen.getByLabelText(/Password/), "longpassword");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });
});
