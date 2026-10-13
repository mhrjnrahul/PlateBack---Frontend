/**
 * localStorage keys used by the mock API. Kept separate from the mock code so
 * the app can offer "Reset demo data" without loading MSW.
 */
export const MOCK_DB_KEY = "plateback.mock-db";
/** Stands in for the real API's httpOnly refresh-token cookie. */
export const MOCK_SESSION_KEY = "plateback.mock-session";

/** Clears saved demo data and the demo login. */
export function clearMockStorage() {
  try {
    localStorage.removeItem(MOCK_DB_KEY);
    localStorage.removeItem(MOCK_SESSION_KEY);
    localStorage.removeItem("plateback.signed-in");
  } catch {
    // Storage unavailable; nothing to clear.
  }
}
