import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/shared/ui/toaster";
import { createQueryClient } from "./query-client";

/** Everything the app needs around the router: server-state cache and toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  // Created once per app instance (and once per test that renders it).
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {/* Only included in development builds */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
