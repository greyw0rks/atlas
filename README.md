# Atlas

**Your coding agent forgets when the session ends. Atlas doesn't.**

Atlas is a persistent memory layer for coding agents. It plugs into Claude Code, Codex, Cursor, or any MCP-capable client and gives the agent a place to write down what it learned: the architecture it reverse-engineered, the bug it spent an hour on, the decision it made and the options it rejected.

Those memories are written to **Walrus Memory on Sui Mainnet**, so they outlive the session, the terminal, and the laptop. A local SQLite file is kept only as a fast, disposable index over them.

Built for the **Tatum × Walrus "Total Recall" hackathon — Track 02, Smart Agents for Real Life.**

---

## The problem

Every coding session starts from zero. The agent re-reads the same files, re-discovers the same constraints, and sometimes re-makes a decision the last agent already rejected. Context windows end; projects don't.

Notes in a markdown file don't fix this either: they are unstructured, they don't follow the repo, and they can't be searched by meaning.

## What Atlas does

- **Remembers across sessions.** Start a session and the agent receives the last session's summary, open tasks, key decisions, tech stack, and constraints before it writes a line of code.
- **Writes memory onchain.** Every memory and decision is uploaded to Walrus Memory on Sui Mainnet. The returned Walrus blob id is stored next to the local row — a verifiable pointer to the actual memory text.
- **Recalls by meaning.** Search is semantic, not keyword. The Walrus Memory relayer embeds and indexes each memory, so "how does auth work here?" finds the memory that says "sessions are JWT-signed in middleware.ts".
- **Checks its own claims.** When a memory names a Sui object id or transaction digest, Atlas asks **Tatum's Sui RPC** what that object or transaction actually is, and stores the answer as provenance. A memory that says "the package is live at 0x…" can be backed by an object lookup instead of trust.
- **Hands off cleanly.** Sessions end with a structured handoff: what I did, what failed, what's next. The same brief is projected to `.atlas/` files and `ATLAS.md` so a human or a non-MCP agent can pick it up.
- **Works across agents.** Claude Code and Codex can share the same memory. Each session records which agent wrote it.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Claude Code · Codex · Cursor · any MCP client               │
└───────────────────────────┬──────────────────────────────────┘
                            │ MCP (stdio, 15 tools)
┌───────────────────────────▼──────────────────────────────────┐
│  Atlas MCP server                                            │
│  sessions · memories · decisions · search · handoff          │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐   ┌────────────▼───────────────┐
│  Walrus Memory (MemWal)     │   │  Tatum Sui RPC             │
│  Sui Mainnet                │   │  object + transaction      │
│  embed → SEAL encrypt →     │   │  lookups for any onchain   │
│  upload blob → semantic     │   │  reference in a memory     │
│  recall                     │   │                            │
└──────────────┬──────────────┘   └────────────────────────────┘
               │ blob id
┌──────────────▼───────────────────────────────────────────────┐
│  SQLite index (Prisma)                                       │
│  rebuildable cache of the blobs: sessions, kinds, tags,      │
│  importance, timestamps, chain provenance                    │
└──────────────────────────────────────────────────────────────┘
```

The important inversion: **Walrus is the system of record, SQLite is the cache.** Wipe the database and the memory text is still on Mainnet, addressed by the blob ids; the local index holds no fact that isn't recoverable from Walrus.

## Memory model

Each memory has a kind, an importance from 1 to 5, tags, and a resolution flag (so a fixed bug keeps its history instead of disappearing).

| Kind | Example |
| --- | --- |
| `ARCHITECTURE` | "The MCP server and dashboard share one Prisma client." |
| `DECISION` | "Chose Walrus over a local vector DB because…" |
| `BUG` | "MemWal returns 401 when the account id is the delegate pubkey." |
| `TODO` | "Wire Tatum health into the status endpoint." |
| `WARNING` | "Sui public fullnode JSON-RPC is deprecated; use gRPC." |
| `IMPORTANT_FILE` | "`lib/memory/memwal.ts` is the only relayer entrypoint." |
| `DEPENDENCY` | "`@mysten-incubation/memwal` ^0.1.8, Prisma 5.22." |
| `SECURITY` | "The delegate key is a Mainnet signing key; server-side only." |
| `CONTEXT` | Hackathon constraints, deadlines, product framing. |

Decisions are recorded separately with a rationale and the alternatives that were considered — because "why" is the part that gets lost first.

## Onchain verification with Tatum

A memory is only as useful as it is true. Atlas extracts Sui references from memory text:

- object ids — `0x` followed by 64 hex characters
- transaction digests — base58, only when explicitly labelled (`tx: …`)

It resolves them through Tatum's Sui RPC gateway (`sui_getObject`, `sui_getTransactionBlock` with a `sui_getTransaction` fallback), records the object type/owner and the transaction status, and appends a one-line provenance note to the copy that is written to Walrus. The dashboard shows a **Tatum verified** badge on those memories.

If the gateway rejects a request, the failure is recorded as provenance instead of being hidden. A Tatum API key is optional: when present it is sent as `x-api-key`, and the gateway also answers keyless requests today.

## The dashboard

- **Workspace** — every repository Atlas knows, with session and open-task counts.
- **Repository** — pick-up-where-you-left-off widget, recent sessions, open tasks, key decisions.
- **Session** — chronological timeline of memories and decisions, each with its Walrus blob link (the mainnet aggregator serves the encrypted blob) and Tatum verification badge.
- **Search** — semantic recall across one repo or all of them.

## Install

See [INSTALL.md](INSTALL.md). The short version:

```bash
./install.sh
```

You need Node 18+, a Walrus Memory delegate key and account id, and optionally a Tatum API key. The gateway answers keyless requests today; a key is recommended for rate limits.

## Repository layout

```
lib/memory/memwal.ts      Walrus Memory client (the only relayer entrypoint)
lib/memory/writer.ts      session lifecycle, memory + decision writes
lib/memory/retrieval.ts   recall, hydration, timelines, stats
lib/chain/tatum.ts        Sui reference extraction + Tatum RPC verification
mcp-server/               MCP server (15 tools, stdio)
app/                      Next.js dashboard
prisma/                   SQLite schema — a rebuildable index
```

## License

MIT
