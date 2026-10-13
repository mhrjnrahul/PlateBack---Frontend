import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, updated live. Use only when the DOM must
 * differ (not just the styles) between screen sizes. False where matchMedia
 * is missing (tests), i.e. the mobile layout.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
