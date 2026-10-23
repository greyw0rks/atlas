## Inspiration

Every coding session with an AI assistant starts with re-explaining the project. "We're on Next.js with Prisma, we chose SQLite because the deploy target is a single node, the auth middleware lives in `middleware.ts`, and last session we abandoned the Redis cache because the free tier expired." Then the window closes and the next session starts from zero.

Notes files don't solve it: unstructured, not searchable by meaning, not shared between tools. The real gap is that agent memory usually lives in a database that belongs to the product, not to the project. When the database goes away, so does everything the agent learned.

Atlas is an answer to that: a memory layer that writes the memory itself to Walrus Memory on Sui Mainnet and keeps only a disposable local index.

## What it does

Atlas is an MCP server for Claude Code, Codex, Cursor, and any MCP-capable client.

- **Remembers across sessions.** Starting a session returns the last session's summary, open tasks, key decisions, tech stack, and constraints.
- **Writes memory onchain.** Every memory and decision is uploaded to Walrus Memory on Mainnet. The returned blob id is stored next to the local row and linked from the dashboard, so the memory can be fetched from the mainnet aggregator.
- **Recalls by meaning.** The relayer embeds and indexes each write. Search is semantic, not keyword.
- **Checks its own claims.** When a memory names a Sui object id or transaction digest, Atlas resolves it through Tatum's Sui RPC and stores the object type/owner or transaction status as provenance. The dashboard shows a **Tatum verified** badge.
- **Hands off cleanly.** Sessions end with a structured handoff that a human or a non-MCP agent can pick up.
- **Works across agents.** Claude Code and Codex share the same memory; each session records which agent wrote it.

## How we built it

**Atlas MCP server (TypeScript).** Fifteen stdio tools covering session lifecycle, memory writes, semantic recall, task queries, repository scanning, git-history extraction, handoff generation, timeline reconstruction, and onchain verification. Built on the official MCP SDK.

**Walrus Memory as system of record.** `lib/memory/memwal.ts` is the only relayer entrypoint. Writes go through `rememberAndWait`; recall goes through the relayer's semantic search. Each SQLite row stores the `blobId` as proof. The schema deliberately treats SQLite as a rebuildable cache: sessions, kinds, tags, importance, timestamps, and provenance — nothing that isn't recoverable from the Walrus copies.

**Tatum Sui RPC for onchain data.** `lib/chain/tatum.ts` extracts Sui references from memory text (0x + 64 hex object ids; labelled transaction digests), resolves them through Tatum's Sui gateway (`sui_getObject`, `sui_getTransactionBlock` with a `sui_getTransaction` fallback), and returns a structured verification record. The record is persisted on the memory row and appended to the copy written to Walrus. A key is optional: when configured it is sent as `x-api-key`, and the gateway also answers keyless requests today. Any rejection is recorded per reference rather than hidden.

**Next.js dashboard.** Workspace, repository, session timeline, and semantic search views. Each memory shows its Walrus blob link and verification badge.

**Installer.** One script sets up dependencies, the SQLite index, the MCP server, the global `atlas-mcp` binary, the `/atlas` skill, and a marker-delimited block in the global `CLAUDE.md`. It backs up `settings.json` and never overwrites the user's existing instructions.

## Challenges

**The MemWal account id is not the public key.** Every write returned HTTP 401 until we found that `MEMWAL_ACCOUNT_ID` must be the on-chain `MemWalAccount` **object id**, not the delegate public key. The id is on the `account::DelegateKeyAdded` event. The error says "unauthorized"; the actual mistake is identifying the wrong object.

**Sui's public JSON-RPC is deprecated.** The simplest verification path — a public fullnode JSON-RPC call — is going away in favour of gRPC and GraphQL. Tatum's gateway exposes the methods Atlas needs, which kept the integration to one provider instead of a set of endpoint workarounds.

**Making proof checkable.** Anyone can write "stored on Walrus" into a column. Linking each row to the mainnet aggregator URL, where the stored (encrypted) blob can actually be fetched, turns the claim into a lookup.

## Accomplishments

- More than ten memories and a recorded decision stored on Walrus Memory Mainnet, each with a blob id — for example `4SqEO_Ef4vBzoJ2xWHOqng7HZ7_0OMMMv7S_YZqckqo`, which is also the Tatum-verified memory below.
- Fifteen MCP tools, a Next.js dashboard, and an installer that is safe to run on an existing Claude Code setup.
- Live Tatum verification against Sui Mainnet: a memory naming the Walrus Memory package was resolved through the gateway (object type and owner recorded), written to Walrus with the provenance attached, and the resulting blob fetched back from the mainnet aggregator. The gateway answered keyless during development; the submission build also sends an API key as `x-api-key`, and the live check reports `auth: api-key`.
- End-to-end typecheck and production build green.

## What's next

- Verification badges on search results and decision rows, not only on the memory detail view.
- Rebuild-the-index tooling that rehydrates the local SQLite cache from the Walrus namespace.
- More agents: Codex and Cursor session capture, not just shared reads.

## Built with

TypeScript, Node.js, Next.js, Prisma, SQLite, Model Context Protocol SDK, Walrus Memory (`@mysten-incubation/memwal`), Tatum Sui RPC, Sui Mainnet.
