/*
 * Links out to a map app (there is no embedded map in v1, design doc 1.7).
 */

/** A pin at the location. */
export function mapSearchUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** Directions from the user's location to the place. */
export function mapDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
