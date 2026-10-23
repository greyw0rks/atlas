// MemoryKind + array (de)serialization helpers.
//
// SQLite (via Prisma) has no enums and no scalar list columns, so:
//   - MemoryKind is a plain string union, validated here.
//   - string[] fields (tags, techStack, importantFiles, alternatives, hitIds)
//     and number[] fields (scores) are stored as JSON-encoded strings.
// Keep MEMORY_KINDS in sync with the comment in prisma/schema.prisma.

export const MEMORY_KINDS = [
  "ARCHITECTURE",
  "DECISION",
  "BUG",
  "TODO",
  "WARNING",
  "IMPORTANT_FILE",
  "DEPENDENCY",
  "SECURITY",
  "CONTEXT",
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export function isMemoryKind(value: string): value is MemoryKind {
  return (MEMORY_KINDS as readonly string[]).includes(value);
}

/** Kinds that count as open tasks (drive RepositoryContext.openTaskCount). */
export const TASK_KINDS: MemoryKind[] = ["TODO", "BUG"];

/** Encode a string[] / number[] for storage in a SQLite String column. */
export function encodeList(list: readonly (string | number)[] | null | undefined): string {
  return JSON.stringify(list ?? []);
}

/** Decode a JSON-encoded string[] from a SQLite String column. */
export function decodeStringList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Decode a JSON-encoded number[] from a SQLite String column. */
export function decodeNumberList(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !Number.isNaN(n)) : [];
  } catch {
    return [];
  }
}
