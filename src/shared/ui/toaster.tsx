import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * App-wide toast container. Mounted once in the app providers; show a toast
 * from anywhere with `toast("Reserved")` or `toast.error("...")`.
 *
 * Uses sonner directly instead of shadcn's wrapper, which depends on
 * next-themes (dark mode), which this app does not have.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      // keep toasts clear of the tab bar and reserve bar (index.css)
      mobileOffset={{ bottom: "calc(var(--tab-bar) + var(--bottom-bar) + 16px)" }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
        } as CSSProperties
      }
      toastOptions={{ classNames: { description: "!text-muted-foreground" } }}
      {...props}
    />
  );
}

export { Toaster };
export { toast } from "sonner";
