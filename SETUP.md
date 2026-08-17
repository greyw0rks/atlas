# Atlas 2.0 Setup Guide

## Prerequisites
- Node.js 20+
- AWS account with Bedrock access (Titan Embeddings v2)
- CockroachDB or PostgreSQL database

## Setup Steps

### 1. Install Dependencies
```bash
npm install
cd mcp-server && npm install && cd ..
```

### 2. Configure Environment
Create `.env` in project root:
```bash
# Database (CockroachDB or PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:26257/db?sslmode=require"

# AWS Bedrock (for embeddings)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

### 3. Initialize Database
```bash
npx prisma db push
npx prisma generate
```

### 4. Build MCP Server
```bash
cd mcp-server
ln -sf ../prisma prisma
npx prisma generate
npm run build
cd ..
```

### 5. Test MCP Server
```bash
node mcp-server/dist/mcp-server/index.js
```
Should output: "Atlas MCP Server running on stdio"

### 6. Configure Claude Code
Add to your Claude Code settings (`~/.claude/settings.json` or IDE settings):
```json
{
  "mcpServers": {
    "atlas": {
      "command": "node",
      "args": ["/absolute/path/to/atlas-2/mcp-server/dist/mcp-server/index.js"],
      "env": {
        "DATABASE_URL": "your-connection-string"
      }
    }
  }
}
```

## Verify Installation
In Claude Code, type `/atlas` — you should see project context and open tasks.

## Known Issues

### SQL Injection Risk
`lib/memory/retrieval.ts:244-248` uses string interpolation in raw SQL. Fix before production:
```typescript
// Replace string interpolation with parameterized queries
const whereClauses: Prisma.Sql[] = [Prisma.sql`m.embedding IS NOT NULL`];
if (repo) whereClauses.push(Prisma.sql`m."repoId" = ${repo.id}`);
```

### Build Process
If you modify TypeScript files, rebuild:
```bash
cd mcp-server && npm run build
```

## Getting AWS Credentials
1. Go to AWS Console → IAM → Users → your user → Security credentials
2. Create access key → "Local code" use case
3. Add to `.env` file
4. Ensure IAM policy includes:
   ```json
   {
     "Effect": "Allow",
     "Action": "bedrock:InvokeModel",
     "Resource": "arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0"
   }
   ```

## Troubleshooting

**"Cannot find module"**: Run `npx prisma generate` in both root and mcp-server directories

**"Database unreachable"**: Verify `DATABASE_URL` in `.env` and run `npx prisma db push`

**"Failed to generate embedding"**: Check AWS credentials and Bedrock model access (no manual activation needed, invoked on first use)
