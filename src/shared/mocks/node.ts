import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Mock API for tests (Node). Started in src/test/setup.ts. */
export const server = setupServer(...handlers);
