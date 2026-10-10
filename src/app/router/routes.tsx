import type { RouteObject } from "react-router";
import { AuthLayout } from "@/app/layout/AuthLayout";
import { MainLayout } from "@/app/layout/MainLayout";
import { PageLoader } from "@/app/layout/PageLoader";
import { NotFoundPage } from "./NotFoundPage";
import { RouteErrorPage } from "./RouteErrorPage";

/*
 * Route table. Each page is lazy-loaded, so its code is a separate bundle
 * that downloads on first visit. Access rules (who may open which page) are
 * added with login in step 9.
 */
export const routes: RouteObject[] = [
  {
    Component: MainLayout,
    HydrateFallback: PageLoader,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        // Errors inside a page render here, so the header and footer stay.
        ErrorBoundary: RouteErrorPage,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/features/listings/pages/LandingPage")).LandingPage,
            }),
          },
          {
            path: "browse",
            lazy: async () => ({
              Component: (await import("@/features/listings/pages/BrowsePage")).BrowsePage,
            }),
          },
          {
            path: "listings/:id",
            lazy: async () => ({
              Component: (await import("@/features/listings/pages/ListingDetailPage"))
                .ListingDetailPage,
            }),
          },
          {
            path: "me/reservations",
            lazy: async () => ({
              Component: (await import("@/features/reservations/pages/MyReservationsPage"))
                .MyReservationsPage,
            }),
          },
          {
            path: "me/notifications",
            lazy: async () => ({
              Component: (await import("@/features/notifications/pages/NotificationsPage"))
                .NotificationsPage,
            }),
          },
          {
            path: "org/:orgId",
            lazy: async () => ({
              Component: (await import("@/features/organizations/pages/OrgDashboardPage"))
                .OrgDashboardPage,
            }),
          },
          {
            path: "org/:orgId/listings/new",
            lazy: async () => ({
              Component: (await import("@/features/listings/pages/CreateListingPage"))
                .CreateListingPage,
            }),
          },
          {
            path: "admin/organizations",
            lazy: async () => ({
              Component: (await import("@/features/admin/pages/AdminOrganizationsPage"))
                .AdminOrganizationsPage,
            }),
          },
          { path: "*", Component: NotFoundPage },
        ],
      },
    ],
  },
  {
    Component: AuthLayout,
    HydrateFallback: PageLoader,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        path: "login",
        lazy: async () => ({
          Component: (await import("@/features/auth/pages/LoginPage")).LoginPage,
        }),
      },
      {
        path: "register",
        lazy: async () => ({
          Component: (await import("@/features/auth/pages/RegisterPage")).RegisterPage,
        }),
      },
    ],
  },
];
