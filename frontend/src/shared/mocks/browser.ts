import { setupWorker } from "msw/browser";
import { loadDb } from "./db";
import { handlers } from "./handlers";

/** Mock API in the browser (dev server and builds; see VITE_USE_MOCKS). */
export const worker = setupWorker(...handlers);

// Restore demo changes from a previous visit (saved by the handlers).
loadDb();
