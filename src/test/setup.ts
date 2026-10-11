import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetDb } from "@/shared/mocks/db";
import { server } from "@/shared/mocks/node";

// Page tests render the whole app (session restore, lazy page, queries), so
// allow a little longer than the default 1 s for things to appear.
configure({ asyncUtilTimeout: 3000 });

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
