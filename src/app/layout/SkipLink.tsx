/** First focusable element on every page; jumps keyboard users past the header. */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
