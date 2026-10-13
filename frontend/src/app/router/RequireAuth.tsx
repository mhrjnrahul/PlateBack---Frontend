import { Navigate, Outlet, useLocation, useParams } from "react-router";
import { PageLoader } from "@/app/layout/PageLoader";
import { useAuth } from "@/features/auth/session/auth-context";
import { ForbiddenPage } from "./ForbiddenPage";

type Rule = "signedIn" | "admin" | "orgMember";

/**
 * Route guard (design doc 4.6 authorization matrix). Signed-out visitors are
 * sent to log in and come back afterwards. The API checks the same rules;
 * this only keeps people from landing on pages that would fail.
 */
export function RequireAuth({ rule = "signedIn" }: { rule?: Rule }) {
  const { status, user } = useAuth();
  const location = useLocation();
  const { orgId } = useParams();

  if (status === "loading") return <PageLoader />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (rule === "admin" && user.role !== "Admin") return <ForbiddenPage />;
  if (rule === "orgMember" && !user.memberships.some((m) => m.organizationId === orgId)) {
    return <ForbiddenPage />;
  }
  return <Outlet />;
}
