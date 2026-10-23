# Atlas MCP server

This directory contains Atlas’s TypeScript server for the Model Context Protocol (MCP). Its 15 tools manage coding sessions, memories, decisions, semantic recall, repository inspection, handoffs, and Sui verification.

The server uses Walrus Memory for remote memory text and semantic recall, Tatum Sui RPC for blockchain lookups, and Prisma with SQLite for local records. See the [Atlas README](../README.md) for the architecture, tool reference, and storage limits.

## Install from the repository

Use Node.js 20 or newer. From the repository root, configure `.env` using [.env.example](../.env.example), then run:

```bash
./install.sh
```

The installer builds this package, links its `atlas-mcp` binary, and registers it with Claude Code and Codex. See [the installation guide](../INSTALL.md) for manual configuration.

## Build and run the server

From the repository root, rebuild the server after source changes:

```bash
npm run build --prefix mcp-server
```

To start the compiled server directly from that directory:

```bash
node mcp-server/dist/mcp-server/index.js
```

The server communicates over standard input and output. Starting it directly does not open the dashboard; use an MCP client to call its tools.

## Configure environment loading

The compiled server loads the first existing `.env` from these locations:

1. The directory set by `ATLAS_HOME`
2. The Atlas checkout containing the compiled server
3. The current working directory

Existing process environment variables take precedence over file values. Keep the server and dashboard configured to use the same SQLite file.

## License

Atlas uses the [MIT license](../LICENSE).
