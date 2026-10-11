import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { ListingSummary } from "@/shared/types/api";
import { ListingCard } from "./ListingCard";
import { ListingImage } from "./ListingImage";

const listing: ListingSummary = {
  id: "listing-test",
  title: "Croissant trio",
  category: "Bakery",
  organization: { id: "org-1", name: "Sunrise Bakery", isVerified: true },
  price: 150,
  originalPrice: 360,
  quantityTotal: 6,
  quantityAvailable: 4,
  pickupStart: "2026-10-11T12:00:00Z",
  pickupEnd: "2026-10-11T14:00:00Z",
  status: "Active",
  distanceKm: 0.4,
  imageUrl: "/images/listings/croissant.jpg",
};

function renderCard(overrides: Partial<ListingSummary> = {}) {
  return render(
    <MemoryRouter>
      <ListingCard listing={{ ...listing, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("ListingCard", () => {
  it("is one link named by the listing title", () => {
    renderCard();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Croissant trio");
    expect(links[0]).toHaveAttribute("href", "/listings/listing-test");
  });

  it("shows the stock left, urgent at 2 or fewer, and sold out", () => {
    const { rerender } = renderCard();
    expect(screen.getByText("4 left")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ListingCard listing={{ ...listing, quantityAvailable: 2 }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("2 left")).toHaveClass("text-urgency");

    rerender(
      <MemoryRouter>
        <ListingCard listing={{ ...listing, quantityAvailable: 0, status: "SoldOut" }} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });
});

describe("ListingImage", () => {
  it("keeps the illustration and drops a photo that fails to load", () => {
    const { container } = render(<ListingImage category="Meals" imageUrl="/missing.jpg" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("draws the illustration when there is no photo", () => {
    const { container } = render(<ListingImage category="Groceries" imageUrl={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".bg-image-groceries")).toBeInTheDocument();
  });
});
