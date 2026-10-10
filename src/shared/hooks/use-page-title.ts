import { useEffect } from "react";

const APP_NAME = "PlateBack";

/** Sets the browser tab title to "<title> | PlateBack" while the page is shown. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
