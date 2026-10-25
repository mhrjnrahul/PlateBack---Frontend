import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

/* Week 5: 40% covered; an off-by-one here hides listings or shows an empty page. */
describe("Pagination", () => {
  it("is hidden when everything fits on one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={12} total={12} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("counts a partly filled last page", () => {
    render(<Pagination page={1} pageSize={12} total={13} onPageChange={vi.fn()} />);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last", () => {
    const { rerender } = render(
      <Pagination page={1} pageSize={10} total={30} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    rerender(<Pagination page={3} pageSize={10} total={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("asks for the neighbouring page", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={10} total={30} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });
});
