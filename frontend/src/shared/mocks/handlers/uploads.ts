import { http, HttpResponse } from "msw";
import { imageProblem } from "@/shared/lib/images";
import type { ImageUpload } from "@/shared/types/api";
import { apiUrl, problem } from "../utils";
import { currentUser, handle, unauthenticated } from "./context";

const invalid = (message: string) =>
  problem(400, "VALIDATION_ERROR", "Validation failed", undefined, { file: [message] });

/** Base64 in chunks, so large photos do not overflow the call stack. */
function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export const uploadHandlers = [
  // POST /uploads/images: the real API stores the file and returns its URL.
  // The mock returns a data: URL, so the photo is saved with the demo data.
  http.post(
    apiUrl("/uploads/images"),
    handle(async ({ request }) => {
      if (!currentUser(request)) return unauthenticated();
      const form = await request.formData().catch(() => null);
      const file = form?.get("file");
      if (!file || typeof file === "string") return invalid("Choose a photo to upload.");
      const reason = imageProblem(file);
      if (reason) return invalid(reason);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const upload: ImageUpload = { url: `data:${file.type};base64,${toBase64(bytes)}` };
      return HttpResponse.json(upload, { status: 201 });
    }),
  ),
];
