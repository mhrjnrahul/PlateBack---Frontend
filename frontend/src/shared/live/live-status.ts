import { useSyncExternalStore } from "react";

/*
 * Whether the SignalR connection (/hubs/live) is up. Pages poll as a fallback:
 * every 15 seconds while it is down, and only as a slow safety net while it is
 * up, because changes then arrive the moment they happen.
 */

let connected = false;
const listeners = new Set<() => void>();

export function setLiveConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  for (const listener of listeners) listener();
}

export function isLiveConnected() {
  return connected;
}

/** Polling interval for live data: `fallbackMs` without a connection, a minute with one. */
export function livePollInterval(fallbackMs: number) {
  return connected ? 60_000 : fallbackMs;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLiveConnected() {
  return useSyncExternalStore(subscribe, isLiveConnected, () => false);
}
