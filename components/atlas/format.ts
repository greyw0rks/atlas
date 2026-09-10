/** Shared formatters for the Atlas UI. */

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/** Collapse an absolute home path to `~/…` for display. */
export function tildePath(path: string): string {
  return path.replace(/^\/home\/[^/]+\//, "~/");
}

/**
 * Group any dated records into descending month buckets for the timeline rail.
 * Returns e.g. [{ month: "JUNE", year: "2024", items: [...] }].
 */
export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string | null,
): Array<{ key: string; month: string; year: string; items: T[] }> {
  const buckets = new Map<string, { month: string; year: string; items: T[] }>();

  for (const item of items) {
    const iso = getDate(item);
    if (!iso) continue;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        month: date.toLocaleString("en-US", { month: "long" }),
        year: String(date.getFullYear()),
        items: [],
      });
    }
    buckets.get(key)!.items.push(item);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => ({ key, ...value }));
}
