# Your coding agent forgets when the session ends. Atlas doesn't.

Every coding session starts the same way: the agent re-reads the files it read yesterday, re-discovers that the database uses relative SQLite paths, and occasionally re-proposes a design the last agent already rejected. The context window closes and everything it learned closes with it.

Markdown notes don't fix this. They are unstructured, they don't follow the repo, and you can't search them by meaning. What an agent needs is not another file — it's memory that outlives the terminal, that other agents can read, and that can be proven to exist.

That is what Atlas is. It is an MCP server that gives Claude Code, Codex, Cursor, or any MCP client a place to write down what it learned. The memories live in **Walrus Memory on Sui Mainnet**. A local SQLite file is only a fast, disposable index over them.

## What gets remembered

Atlas models memory, not chat logs. Every entry has a kind, an importance from 1 to 5, tags, and a resolution flag — so a fixed bug keeps its history instead of disappearing.

| Kind | Example |
| --- | --- |
| `ARCHITECTURE` | "The MCP server and the dashboard share one Prisma client." |
| `DECISION` | "Chose Walrus over a local vector DB because…" |
| `BUG` | "MemWal returns 401 when the account id is the delegate pubkey." |
| `TODO` | "Wire Tatum health into the status endpoint." |
| `WARNING` | "Sui public fullnode JSON-RPC is deprecated; use gRPC." |
| `SECURITY` | "The delegate key is a Mainnet signing key; server-side only." |

Decisions are recorded separately, with a rationale and the alternatives that were rejected. "Why" is the part that gets lost first, and it is the part that costs the most to reconstruct.

The client surface is fifteen MCP tools: session lifecycle, memory writes and semantic recall, task queries, repository scanning, git-history extraction, handoff generation, timeline reconstruction, and onchain verification.

## Why Walrus

The first version of Atlas kept everything in CockroachDB and embedded text with AWS Bedrock Titan. It worked, but the memory was trapped behind one database in one region. If the database went away, the memories went away with it.

Walrus Memory changes the shape of the system. The relayer embeds the text, encrypts it with SEAL, uploads it to Walrus, and returns a **blob id**. Atlas stores that blob id on the local row. The database is now a cache; the memory itself is on Mainnet.

That inversion has a concrete consequence: wiping the local SQLite file does not lose the memories. They are still addressed by their blob ids, and the mainnet aggregator serves the stored blob:

```
https://aggregator.walrus-mainnet.walrus.space/v1/blobs/<blob-id>
```

The dashboard links to that URL on every memory. A memory that claims to be durable can be checked rather than believed.

Recall is semantic, not keyword. The relayer embeds and indexes each write, so "how does auth work here?" finds the memory that says "sessions are JWT-signed in `middleware.ts`" even though the words don't overlap.

## Why Tatum

A memory is only as useful as it is true, and coding agents working on blockchain projects write down a lot of addresses.

Atlas extracts Sui references from memory text — object ids (`0x` plus 64 hex characters) and explicitly labelled transaction digests — and resolves them through **Tatum's Sui RPC gateway**. It asks the chain what the object actually is: its type, its owner, its version. For transactions, it asks for status and effects. The answer is stored as provenance on the memory row and appended as a one-line note to the copy written to Walrus.

So a memory that says "the package is live at `0x…`" can carry the object's real type and owner instead of asking the next agent to trust a sentence. The dashboard marks those memories **Tatum verified**.

Two details matter for honesty:

- Tatum's Sui gateway currently answers keyless requests, so verification works without a key; when a key is configured it is sent as `x-api-key`. Atlas never hides a rejection — the failure is recorded on the memory as provenance.
- The verification is a point-in-time fact. The stored provenance includes the network and the timestamp, because an object can change after it was checked.

## The architecture

```
Claude Code · Codex · Cursor · any MCP client
                  │  MCP (stdio, 15 tools)
         ┌────────▼─────────┐
         │ Atlas MCP server │
         └───┬──────────┬───┘
             │          │
   ┌─────────▼──┐   ┌───▼──────────────┐
   │ Walrus     │   │ Tatum Sui RPC    │
   │ Memory     │   │ object + tx      │
   │ Sui Mainnet│   │ lookups          │
   └─────────┬──┘   └──────────────────┘
             │ blob id
   ┌─────────▼────────────────────────┐
   │ SQLite index (Prisma)            │
   │ rebuildable cache: sessions,     │
   │ kinds, tags, timestamps, proof   │
   └──────────────────────────────────┘
```

Sessions are explicit. Starting one returns the repository's last summary, open tasks, key decisions, tech stack, and constraints before the agent writes a line of code. Ending one writes a handoff: what I did, what failed, what's next. The same brief is projected to `.atlas/` files and an `ATLAS.md` so a human or a non-MCP agent can pick it up.

## Three things this build taught me

**1. The account id is not the public key.** The MemWal SDK signs with an Ed25519 delegate key, and for a while every write returned HTTP 401. The cause: `MEMWAL_ACCOUNT_ID` must be the on-chain `MemWalAccount` **object id**, not the delegate's public key. The object id is on the `account::DelegateKeyAdded` event. The error message says "unauthorized"; the actual mistake is a wrong identifier type.

**2. Sui's public JSON-RPC is deprecated.** The obvious way to verify an object is a JSON-RPC call to a public fullnode. That path is on its way out; the current interfaces are gRPC and GraphQL. Tatum's gateway still exposes the JSON-RPC methods Atlas needs (`sui_getObject`, `sui_getTransactionBlock`), which made it the right single integration point rather than a pile of per-endpoint workarounds.

**3. Proof has to be checkable by someone else.** It is easy to write "stored on Walrus" in a database column. It is harder to make that claim survive a skeptic. Linking each row to a mainnet aggregator URL, and showing the blob id next to the memory, turns a claim into a lookup. The blobs are encrypted — the aggregator returns ciphertext — but their existence and addressability are the proof.

## Status

Atlas is running with its memories on Sui Mainnet today: more than ten memories and a recorded decision in the `atlas` namespace, each with a blob id. The MCP server, the dashboard, the installer, and the verification tool are built and green. The repository is public.

The Tatum path is live too: it has resolved real Sui objects through the gateway and stored the result as provenance on the memory, with the same record appended to the Walrus copy. What is still missing is breadth — more agents writing memory, and a rebuild tool that rehydrates the local index from the Walrus namespace.

## Links

- Repository: <https://github.com/greyw0rks/atlas>
- Walrus Memory: <https://memory.walrus.xyz>
- Tatum: <https://tatum.io>

*Built for the Tatum × Walrus "Total Recall" hackathon, Track 02 — Smart Agents for Real Life.*
