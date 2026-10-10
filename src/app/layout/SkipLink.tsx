import type { MouseEvent } from "react";

const MAIN_ID = "main-content";

/**
 * First focusable element on every page; jumps keyboard users past the header.
 * (not-sr-only resets padding, so padding is set on focus too.)
 * Focus is moved by hand so the URL does not change (a "#main-content" hash
 * would count as a navigation for the router).
 */
export function SkipLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById(MAIN_ID);
    if (!main) return;
    event.preventDefault();
    main.focus(); // focusing also scrolls it into view
  }

  return (
    <a
      href={`#${MAIN_ID}`}
      onClick={handleClick}
      className="sr-only rounded-md bg-primary font-semibold text-primary-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
    >
      Skip to main content
    </a>
  );
}
