import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { DevRoleSwitcher } from "@/features/auth/components/DevRoleSwitcher";
import { SessionProvider } from "@/features/auth/session/SessionProvider";
import { Toaster } from "@/shared/ui/toaster";
import { createQueryClient } from "./query-client";

/** Everything the app needs around the router: server-state cache, session and toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  // Created once per app instance (and once per test that renders it).
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        {import.meta.env.DEV && <DevRoleSwitcher />}
      </SessionProvider>
      <Toaster />
      {/* Only included in development builds */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
