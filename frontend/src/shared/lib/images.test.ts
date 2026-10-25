import { afterEach, describe, expect, it, vi } from "vitest";
import { imageProblem, MAX_IMAGE_BYTES, shrinkImage } from "./images";

/* Week 5: photo checks were 27% covered; they decide what reaches the upload endpoint. */
describe("imageProblem", () => {
  it.each([
    ["image/jpeg", 1000, null],
    ["image/png", MAX_IMAGE_BYTES, null],
    ["image/webp", 1, null],
    ["image/gif", 1000, "Use a JPEG, PNG or WebP photo."],
    ["application/pdf", 1000, "Use a JPEG, PNG or WebP photo."],
    ["image/jpeg", MAX_IMAGE_BYTES + 1, "The photo must be 10 MB or smaller."],
  ])("%s of %i bytes: %s", (type, size, expected) => {
    expect(imageProblem({ type, size })).toBe(expected);
  });
});

describe("shrinkImage", () => {
  afterEach(() => vi.unstubAllGlobals());
  const file = new File([new Uint8Array(2000)], "bread.jpg", { type: "image/jpeg" });

  it("keeps the original when the browser cannot decode images", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    expect(await shrinkImage(file)).toBe(file);
  });

  it("keeps the original when decoding fails", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("corrupt")));
    expect(await shrinkImage(file)).toBe(file);
  });
});
