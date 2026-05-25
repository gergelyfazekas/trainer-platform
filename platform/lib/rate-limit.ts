const store = new Map<string, number[]>();
const WINDOW_MS = 60_000;

export function checkRateLimit(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (store.get(ip) ?? []).filter((t) => t > cutoff);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  store.set(ip, timestamps);
  if (store.size > 10_000) {
    for (const [key, ts] of store) {
      if (ts.every((t) => t <= cutoff)) store.delete(key);
    }
  }
  return true;
}
