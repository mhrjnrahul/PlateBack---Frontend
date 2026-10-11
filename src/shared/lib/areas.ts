/**
 * Areas a customer can search from. There is no geocoding in v1 (design doc
 * 1.7), so locations are either one of these or the browser's geolocation.
 */
export type Area = { id: string; label: string; lat: number; lng: number };

export const AREAS: Area[] = [
  { id: "thamel", label: "Thamel, Kathmandu", lat: 27.7154, lng: 85.3123 },
  { id: "baneshwor", label: "New Baneshwor, Kathmandu", lat: 27.689, lng: 85.342 },
  { id: "boudha", label: "Boudha, Kathmandu", lat: 27.7215, lng: 85.362 },
  { id: "patan", label: "Patan, Lalitpur", lat: 27.673, lng: 85.325 },
  { id: "bhaktapur", label: "Bhaktapur", lat: 27.6722, lng: 85.428 },
];

export const DEFAULT_AREA = AREAS[0]!;

export function findArea(id: string | null | undefined) {
  return AREAS.find((a) => a.id === id);
}

/** Browser geolocation as a promise (rejects if denied or unavailable). */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location is not available in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Could not get your location. Choose an area instead.")),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  });
}
