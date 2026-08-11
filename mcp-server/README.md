# Atlas MCP Server

MCP server exposing Atlas's persistent memory capabilities to AI agents.

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Add to your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["/home/greyw0rks/atlas/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "your-cockroachdb-connection-string"
      }
    }
  }
}
```

## Tools

- `trace_address` — Trace wallet across all chains, store in memory
- `search_memory` — Search investigations by address/tx/keyword
- `get_investigation` — Retrieve full investigation data
- `get_route_priors` — Query learned bridge routes

## CockroachDB Integration

Uses CockroachDB Cloud for:
- Distributed vector indexing (1024-dim embeddings)
- Global read/write with 99.999% uptime
- ACID transactions across investigations
- Semantic search over wallet activity
