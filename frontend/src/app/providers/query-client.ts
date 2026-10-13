import { QueryClient } from "@tanstack/react-query";

/** Shared defaults for every query in the app. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30 s, then refetches in the background.
        staleTime: 30_000,
        // One retry is enough for a flaky connection; more just delays the error.
        retry: 1,
      },
    },
  });
}
