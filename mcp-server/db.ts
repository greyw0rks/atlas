// The MCP server and the Next.js dashboard share ONE Prisma client and ONE
// SQLite database. Re-exporting the root singleton (instead of constructing a
// second client here) guarantees both surfaces read and write the same index —
// and keeps a single connection pool per process.
export { prisma } from "../lib/db.js";
