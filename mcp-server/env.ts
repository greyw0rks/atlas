// Load Atlas's `.env` before anything constructs a Prisma client or reads a
// credential. The MCP server is launched by the editor/agent as a bare Node
// process (e.g. `atlas-mcp` on $PATH), so unlike the Next.js app it never gets
// `.env` loaded for free — without this, DATABASE_URL and the MemWal delegate
// key are empty and every tool call fails.
//
// Resolution order (first existing file wins; real process env always wins over
// file values because dotenv does not override by default):
//   1. $ATLAS_HOME/.env
//   2. <repo root>/.env, derived from this module's location
//      (dist/mcp-server/env.js → ../../../.env)
//   3. the current working directory's .env
import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));

const candidates = [
  process.env.ATLAS_HOME ? resolve(process.env.ATLAS_HOME, ".env") : null,
  resolve(here, "../../../.env"), // dist/mcp-server → repo root
  resolve(process.cwd(), ".env"),
].filter((p): p is string => Boolean(p));

const envPath = candidates.find((p) => existsSync(p));

if (envPath) {
  config({ path: envPath });
} else {
  console.warn(
    `[atlas] no .env found (looked in: ${candidates.join(", ")}). ` +
      "Set ATLAS_HOME or create one so the memory store can connect.",
  );
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "[atlas] DATABASE_URL is not set — the SQLite index will not connect. " +
      "Run `npx prisma db push` in the Atlas checkout.",
  );
}
