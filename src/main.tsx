import "@fontsource-variable/inter";
import "@/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers/AppProviders";
import { routes } from "@/app/router/routes";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found in index.html");

const router = createBrowserRouter(routes);

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
