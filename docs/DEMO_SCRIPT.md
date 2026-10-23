# Atlas — demo script

**Length:** ~3 minutes
**Track:** Tatum × Walrus "Total Recall" — Track 02, Smart Agents for Real Life
**Pitch line:** Your coding agent forgets when the session ends. Atlas doesn't.

Record at 1440p if possible; the terminal and the dashboard both need to be legible.
Keep the browser at a readable zoom and hide bookmarks.

---

## 0:00 — The problem (15s)

**On screen:** landing page hero.

> "Every coding session starts with re-explaining the project. The agent re-reads
> yesterday's files, re-discovers the database setup, and sometimes re-proposes a
> design the last agent already rejected. The context window closes and everything
> it learned closes with it.
>
> Atlas is an MCP server that gives coding agents memory that outlives the terminal —
> memory that lives on Walrus Memory Mainnet, not in someone's database."

## 0:15 — Session resume (35s)

**On screen:** Claude Code in the Atlas repo.

> "I'm starting a session through the Atlas MCP server."

Call:

```
atlas_start_session(repoPath="/home/greyw0rks/atlas", agentId="claude-code")
```

> "Before I write a line of code, it hands back the last session's summary, the
> technologies in use, the constraints we committed to, open tasks, and the key
> decisions with their rationale. That's the part that normally gets lost."

Point at two concrete entries, e.g. the MemWal account-id bug ("the account id is
the object id, not the delegate public key") and the decision to make SQLite a
disposable index.

## 0:50 — Write a memory that carries onchain proof (45s)

> "Now the important part. This memory names a real Sui object."

Call:

```
atlas_save_memory(
  sessionId="<current session id>",
  repoId="<current repo id>",
  kind="ARCHITECTURE",
  importance=5,
  content="The Walrus Memory Move package on Sui mainnet is 0xe7c16f...d7f5.",
  tags=["walrus", "tatum"]
)
```

Point at the response:

- `storedOnWalrus: true`
- `blobId: 4SqEO_Ef4vBzoJ2xWHOqng7HZ7_0OMMMv7S_YZqckqo`
- `chainVerification.objects[0]`: type `package`, owner `Immutable`, version `1`

> "Two proofs in one write. The blob id is the Walrus copy on Mainnet. The
> verification is Tatum's Sui RPC gateway answering what that object actually is —
> a package, immutable, version one. Atlas stores that answer as provenance and
> appends it to the copy written to Walrus."

Paste the aggregator URL in a browser tab:

```
https://aggregator.walrus-mainnet.walrus.space/v1/blobs/4SqEO_Ef4vBzoJ2xWHOqng7HZ7_0OMMMv7S_YZqckqo
```

> "The blob is encrypted, as it should be. The point is that the claim 'stored on
> Walrus' is now a lookup anyone can repeat, not a sentence you have to trust."

## 1:35 — The dashboard (30s)

**On screen:** `/session/<id>` and then `/repo/<id>`.

> "The session view renders every memory with its Walrus blob link and a Tatum
> verified badge. The repository view shows the same proof on recorded decisions,
> so the 'why' survives alongside the 'what'."

Then `/search`:

> "And search is semantic, not keyword. The relayer embeds and indexes each write,
> so a question phrased differently still finds the memory. Results carry the same
> blob link and verification badge."

Run one query, e.g. `walrus memory package on mainnet`.

## 2:05 — Why this architecture (35s)

**On screen:** architecture diagram from the blog, or the landing page's how-it-works.

> "SQLite is only a fast, disposable index. The system of record is Walrus Memory
> on Sui Mainnet: the relayer encrypts the text with SEAL, uploads the blob, and
> returns an id. Wiping the local database does not lose the memories — they are
> still addressed by their blob ids.
>
> Tatum is the second half. Coding agents write down blockchain addresses, and a
> memory is only as useful as it is true. Tatum's Sui gateway lets Atlas check the
> object before the next agent trusts the sentence."

## 2:40 — Close (15s)

> "Fifteen MCP tools, a Next.js dashboard, and an installer that is safe to run on
> an existing Claude Code setup. More than ten memories and a recorded decision are
> on Walrus Mainnet today — each with a blob id, and the latest with a Tatum
> verification record.
>
> Atlas. Your coding agent forgets when the session ends. This one doesn't."

---

## Recording checklist

- [ ] `.env` is loaded but never shown on screen.
- [ ] No private keys, account ids, or API keys visible in any terminal scrollback.
- [ ] Blob id and `Tatum verified` badge are legible at 1080p.
- [ ] Aggregator tab returns HTTP 200 (encrypted bytes are expected).
- [ ] Recording shows the repo URL: `github.com/greyw0rks/atlas`.
