import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/features/auth/session/AuthProvider";
import { Toaster } from "@/shared/ui/toaster";
import { LiveUpdates } from "./LiveUpdates";
import { createQueryClient } from "./query-client";

/** Everything the app needs around the router: server-state cache, signed-in user, live updates and toasts. */
export function AppProviders({
  children,
  queryClient: providedClient,
}: {
  children: ReactNode;
  /** Tests pass their own client (no retries). */
  queryClient?: QueryClient;
}) {
  // Created once per app instance.
  const [queryClient] = useState(() => providedClient ?? createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LiveUpdates />
        {children}
      </AuthProvider>
      <Toaster />
      {/* Only included in development builds */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
