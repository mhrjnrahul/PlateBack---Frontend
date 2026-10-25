import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render-app";

/** The results heading once the count has arrived (it reads "Finding listings..." while loading). */
const resultsHeading = () =>
  screen.findByRole("heading", { level: 2, name: /^\d+ listings? within/ });
const cardTitles = () =>
  within(screen.getByRole("region", { name: /listings? within/ }))
    .getAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);

describe("BrowsePage", () => {
  it("lists nearby listings for the chosen area", async () => {
    await renderApp("/browse?area=thamel&radius=25");
    expect(await resultsHeading()).toHaveTextContent(
      "11 listings within 25 km of Thamel, Kathmandu",
    );
    expect(cardTitles()).toContain("Mixed pastry box");
  });

  it("filters by category and keeps the filter in the URL", async () => {
    const { user, router } = await renderApp("/browse?radius=25");
    await resultsHeading();
    const filters = within(screen.getByRole("complementary", { name: "Filters" }));
    await user.click(filters.getByRole("radio", { name: "Bakery" }));
    await waitFor(() => expect(router.state.location.search).toContain("category=Bakery"));
    // Same distance for the Sunrise Bakery listings, so compare as a set
    await waitFor(() =>
      expect(cardTitles().sort()).toEqual([
        "Bread & rolls bag",
        "Croissant trio",
        "Mixed pastry box",
        "Sourdough loaf",
      ]),
    );
  });

  it("searches as you type", async () => {
    const { user, router } = await renderApp("/browse?radius=25");
    await resultsHeading();
    await user.type(screen.getByRole("searchbox", { name: "Search listings" }), "momo");
    await waitFor(() => expect(router.state.location.search).toContain("q=momo"));
    await waitFor(() => expect(cardTitles()).toEqual(["Momo platter"]));
  });

  it("shows an empty state with a way to widen the search", async () => {
    const { user } = await renderApp("/browse?area=bhaktapur&radius=1&category=Beverages");
    expect(
      await screen.findByRole("heading", { name: "Nothing nearby right now" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Search within 25 km" }));
    expect(await resultsHeading()).toHaveTextContent("within 25 km of Bhaktapur");
  });

  it("shows active filters as chips that remove themselves", async () => {
    const { user, router } = await renderApp("/browse?radius=25&category=Meals&time=tonight");
    await resultsHeading();
    await user.click(screen.getByRole("button", { name: "Remove filter: Meals" }));
    await waitFor(() => expect(router.state.location.search).not.toContain("category"));
    expect(router.state.location.search).toContain("time=tonight");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
  });
});
