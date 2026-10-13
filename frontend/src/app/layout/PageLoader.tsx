/** Shown while a page's code is loading on first visit. */
export function PageLoader() {
  return (
    <div role="status" className="page-container py-16 text-center text-muted-foreground">
      Loading…
    </div>
  );
}
