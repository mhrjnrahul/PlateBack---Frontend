import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers/AppProviders";
import { routes } from "@/app/router/routes";

/**
 * Starts the mock API only when VITE_USE_MOCKS is "true" (see .env.example).
 * Since Week 4 the app talks to the real API by default; the mocks remain for
 * working on the UI without a backend. MSW is loaded on demand, so it is not
 * in the bundle when off.
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;
  const { worker } = await import("@/shared/mocks/browser");
  await worker.start({
    // Only API calls are mocked; fonts, images and scripts load normally.
    onUnhandledFrame: "bypass",
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in index.html");

await enableMocking();

const router = createBrowserRouter(routes);

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
