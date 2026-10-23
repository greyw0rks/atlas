# Installing Atlas

## What you need

- **Node.js 18+** and npm
- A **Walrus Memory delegate key** and its **account object id** — create them at <https://memory.walrus.xyz/dashboard>
- Optional: a **Tatum API key** (Sui RPC). The gateway also answers keyless requests today; a key is recommended for rate limits and production use.

No database server is required. The local index is a SQLite file created on first run.

## One command

```bash
cd /path/to/atlas
cp .env.example .env    # then fill in the values
./install.sh
```

The installer:

1. checks Node and npm
2. verifies `.env` exists
3. installs root and MCP-server dependencies
4. creates the SQLite schema (`prisma db push`)
5. builds the MCP server and links `atlas-mcp` globally
6. registers the MCP server in `~/.claude/settings.json` (after backing it up)
7. installs the `/atlas` skill
8. appends an Atlas block to `~/.claude/CLAUDE.md` without overwriting your existing instructions
9. registers the same MCP server in Codex (`~/.codex/config.toml`) and appends
   an Atlas block to `~/.codex/AGENTS.md`

Restart Claude Code and Codex afterwards.

## Environment

`.env.example` documents every variable. The three that matter:

```bash
# The on-chain MemWalAccount object id (0x + 64 hex) — NOT the delegate public key.
# Using the public key here makes the relayer reject requests with HTTP 401.
MEMWAL_PRIVATE_KEY="<delegate private key>"
MEMWAL_ACCOUNT_ID="0x<memwal account object id>"

# Optional. Sent as x-api-key when set; the gateway also answers keyless today.
TATUM_API_KEY=""
```

Find the account object id from the `account::DelegateKeyAdded` event emitted when the delegate key was registered (its JSON has an `account_id` field), or from the MemWal dashboard.

The delegate private key is a Mainnet signing key. Keep it server-side; `.env` is gitignored.

## Manual install

```bash
npm install
npx prisma db push
npx prisma generate

cd mcp-server
npm install
npm run build
npm link
```

Then add Atlas to your MCP client configuration:

```json
{
  "mcpServers": {
    "atlas": {
      "command": "atlas-mcp"
    }
  }
}
```

For Codex, register it via the CLI (this writes `~/.codex/config.toml`):

```bash
codex mcp add atlas -- atlas-mcp
# or, without the global link:
codex mcp add atlas -- node $PWD/mcp-server/dist/mcp-server/index.js
# see what got written
codex mcp list
```

Or add the table by hand to `~/.codex/config.toml`:

```toml
[mcp_servers.atlas]
command = "atlas-mcp"
```

The installer (`./install.sh`) does step 6 (global build + link) and this Codex
registration automatically (step 7b), plus appends an Atlas block to
`~/.codex/AGENTS.md` so Codex starts sessions with the right agent id.

For VS Code agent mode, the same entry goes in `.vscode/mcp.json` under
`"servers"` with `"type": "stdio"`.

## Run the dashboard

```bash
npm run dev
```

Open <http://localhost:3000/workspace>. The dashboard reads the same SQLite index as the MCP server, so memories written by your agent appear immediately.

The Vercel deployment serves the public website and a local dashboard guide.
Dashboard URLs redirect to that guide, and memory API routes are unavailable
there. Run the dashboard locally with your own `.env`; no local memory index
or Walrus signing credentials are uploaded to Vercel.

## Verify

```bash
# Server starts and speaks MCP over stdio
atlas-mcp

# In Claude Code
/atlas
```

Or ask the agent to save a memory and search for it. A successful write returns a `blobId`; the same memory appears on the session page with a Walrus link.

To check Tatum specifically, call `atlas_verify_onchain` with a known Sui object id. It returns the object's type and owner, plus whether the call used an API key or ran keyless. Any rejection is returned per reference rather than hidden.

## Rollback

```bash
cp ~/.claude/settings.json.backup-YYYYMMDD-HHMMSS ~/.claude/settings.json
cd mcp-server && npm unlink
rm -rf ~/.claude/skills/atlas
```

## Updating

```bash
git pull
npm install
cd mcp-server && npm install && npm run build
```

The global link and settings stay valid. Restart Claude Code.

## Multi-machine

Use the same `.env` on every machine. Each machine keeps its own SQLite index, but all memories live in the same Walrus Memory account, so recall works from anywhere.

## Troubleshooting

- **`atlas-mcp: command not found`** — `npm link` did not reach your PATH; restart the terminal or add npm's global bin directory to `PATH`.
- **Every write returns `blobId: null`** — the relayer is unreachable or credentials are wrong. Check that `MEMWAL_ACCOUNT_ID` is the object id, not the public key.
- **`atlas_verify_onchain` reports an auth error** — the gateway started requiring a key. Add `TATUM_API_KEY`; no other config changes.
- **WSL2: Prisma/fetch cannot reach the network** — no IPv6 route but DNS returns AAAA. Run Node with `NODE_OPTIONS=--no-network-family-autoselection`.
