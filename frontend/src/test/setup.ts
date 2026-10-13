import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { File as NodeFile } from "node:buffer";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetDb } from "@/shared/mocks/db";
import { server } from "@/shared/mocks/node";

// Page tests render the whole app (session restore, lazy page, queries), so
// allow a little longer than the default 1 s for things to appear.
configure({ asyncUtilTimeout: 3000 });

// jsdom has no object URLs; photo previews only need a string.
URL.createObjectURL ??= () => "blob:test-preview";
URL.revokeObjectURL ??= () => undefined;
// Uploads: Node's fetch only accepts its own FormData and File, not jsdom's
// (a browser has just one of each). Node's FormData is reached through Response.
globalThis.File = NodeFile;
globalThis.FormData = (
  await new Response("", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).formData()
).constructor as typeof FormData;

// Every test talks to the same mock API as the browser. Requests to anything
// that is not mocked fail loudly instead of reaching the network.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers(); // drop per-test overrides (server.use)
  resetDb(); // undo data changes, so tests stay independent
  localStorage.clear(); // demo session
});

afterAll(() => server.close());
