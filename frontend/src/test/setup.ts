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
// React 19 also calls `new FormData(form)` when a form submit navigates, which
// Node's version cannot do, so a form is read with jsdom's and copied over
// (Week 5: this threw an unhandled error after the landing page's search).
const JsdomFormData = globalThis.FormData;
const NodeFormData = (
  await new Response("", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).formData()
).constructor as typeof FormData;
class TestFormData extends NodeFormData {
  constructor(form?: HTMLFormElement, submitter?: HTMLElement | null) {
    super();
    if (form) {
      for (const [name, value] of new JsdomFormData(form, submitter)) this.append(name, value);
    }
  }
}
globalThis.File = NodeFile;
globalThis.FormData = TestFormData;

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
