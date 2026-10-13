import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** Previous / next with the current position. Hidden when there is one page. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t pt-6">
      <Button variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft aria-hidden="true" />
        Previous
      </Button>
      <p className="text-sm text-muted-foreground">
        Page {page} of {pages}
      </p>
      <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
        Next
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
