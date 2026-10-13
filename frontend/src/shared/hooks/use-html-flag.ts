import { useEffect } from "react";

/**
 * Sets a data attribute on <html> while `on` is true. Used by the fixed bars
 * at the bottom of the screen, so CSS (styles/index.css) can reserve room for
 * them in the page padding and toast offsets.
 */
export function useHtmlFlag(name: `data-${string}`, on: boolean) {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.setAttribute(name, "");
    return () => root.removeAttribute(name);
  }, [name, on]);
}
