import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { formatRelative } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { OrganizationStatus } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import { EmptyState, ErrorState } from "@/shared/ui/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { adminOrganizationsQuery } from "../api/admin-api";
import { ReviewPanel } from "../components/ReviewPanel";
import { PageHeader } from "@/shared/ui/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

const STATUSES: OrganizationStatus[] = ["Pending", "Verified", "Suspended", "Rejected"];

/** Clear the verification queue quickly and leave an audit trail (wireframe 7). */
export function AdminOrganizationsPage() {
  usePageTitle("Organizations");
  const [searchParams, setSearchParams] = useSearchParams();
  const status = STATUSES.find((s) => s.toLowerCase() === searchParams.get("status")) ?? "Pending";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Counts for every tab (note 1)
  const counts = useQueries({ queries: STATUSES.map((s) => adminOrganizationsQuery(s)) });
  const list = useQuery(adminOrganizationsQuery(status));
  const selected = list.data?.items.find((o) => o.id === selectedId) ?? null;

  function changeTab(value: string) {
    setSelectedId(null);
    setSearchParams(value === "Pending" ? {} : { status: value.toLowerCase() }, { replace: true });
  }

  return (
    <div className="page-container py-8 md:py-10">
      <PageHeader
        title="Organizations"
        description="Every decision is recorded in the audit log and sent to the owner."
      />

      <Tabs value={status} onValueChange={changeTab} className="mt-6">
        <TabsList aria-label="Organization status">
          {STATUSES.map((s, i) => (
            <TabsTrigger key={s} value={s}>
              {s}
              {/* A real space, so the name reads "Pending 3", not "Pending3" */}
              {counts[i]?.data && (
                <>
                  {" "}
                  <span className="text-muted-foreground">{counts[i].data.total}</span>
                </>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((s) => (
          <TabsContent key={s} value={s}>
            {s !== status ? null : list.isError ? (
              <ErrorState error={list.error} onRetry={() => void list.refetch()} />
            ) : list.isPending ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : list.data.items.length === 0 ? (
              <EmptyState
                title={s === "Pending" ? "The queue is empty" : `No ${s.toLowerCase()} businesses`}
              >
                {s === "Pending" && "New businesses appear here when they sign up."}
              </EmptyState>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
                <div className="relative overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[36rem] text-sm">
                    <caption className="sr-only">{s} businesses</caption>
                    <thead className="border-b bg-surface text-left text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Business
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Owner
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          Submitted
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          <span className="sr-only">Action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {list.data.items.map((org) => (
                        <tr key={org.id} className={cn(org.id === selectedId && "bg-selected")}>
                          <th scope="row" className="px-4 py-2.5 text-left">
                            <span className="block font-semibold">{org.name}</span>
                            <span className="block font-normal text-muted-foreground">
                              {org.address}
                            </span>
                          </th>
                          <td className="px-4 py-2.5">{org.ownerName}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {formatRelative(org.createdAt)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              variant={org.id === selectedId ? "secondary" : "outline"}
                              size="sm"
                              aria-pressed={org.id === selectedId}
                              onClick={() => setSelectedId(org.id)}
                              aria-label={`Review ${org.name}`}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:sticky lg:top-24 lg:self-start">
                  {selected ? (
                    <ReviewPanel
                      key={selected.id}
                      org={selected}
                      onDone={() => setSelectedId(null)}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                      Choose a business to review its details.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
