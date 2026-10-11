/** Photo rules shared by the upload field and the mock API. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** A message for a file that cannot be used as a photo, or null when it is fine. */
export function imageProblem(file: { type: string; size: number }) {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPEG, PNG or WebP photo.";
  if (file.size > MAX_IMAGE_BYTES) return "The photo must be 10 MB or smaller.";
  return null;
}

/**
 * Scales a photo down to at most `maxWidth` pixels wide as a JPEG, so uploads
 * are quick on mobile data. Returns the original file when the browser cannot
 * resize or the result would not be smaller.
 */
export async function shrinkImage(file: File, maxWidth = 1280): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    // JPEG has no transparency: put see-through PNG areas on white, not black
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
