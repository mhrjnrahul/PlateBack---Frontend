import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api-client/client";
import type { OrganizationReviewItem, OrganizationStatus, Page } from "@/shared/types/api";

export const adminKeys = {
  all: ["admin", "organizations"] as const,
  list: (status: OrganizationStatus) => [...adminKeys.all, status] as const,
};

export function adminOrganizationsQuery(status: OrganizationStatus) {
  return queryOptions({
    queryKey: adminKeys.list(status),
    queryFn: ({ signal }) =>
      api.get<Page<OrganizationReviewItem>>("/admin/organizations", {
        query: { status, pageSize: 50 },
        signal,
      }),
  });
}

export type ReviewDecision = "verify" | "reject" | "suspend";

export function useReviewDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: ReviewDecision;
      reason?: string;
    }) =>
      api.post<OrganizationReviewItem>(
        `/admin/organizations/${id}/${decision}`,
        reason ? { reason } : undefined,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
