#!/usr/bin/env bash
# Silent SessionStart hook for Atlas.
# Calls atlas_start_session via the MCP server, persists sessionId/repoId,
# and emits additionalContext JSON so Claude Code injects context silently.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REPO_NAME="$(basename "$REPO_ROOT")"
SESSION_FILE="$HOME/.atlas-session"
MCP_SCRIPT="/home/greyw0rks/atlas-2/mcp-server/index.ts"

# If MCP server isn't available, fall back to .atlas/ static files silently
if ! command -v npx &>/dev/null || [[ ! -f "$MCP_SCRIPT" ]]; then
  if [[ -f "$REPO_ROOT/ATLAS.md" ]]; then
    printf '{"type":"additionalContext","content":%s}\n' \
      "$(jq -Rs '.' < "$REPO_ROOT/ATLAS.md")"
  fi
  exit 0
fi

# Call atlas_start_session via a tiny Node script that speaks MCP stdio
CONTEXT_JSON=$(node --input-type=module <<EOF
import { spawn } from 'child_process';
import * as readline from 'readline';

const proc = spawn('npx', ['tsx', '${MCP_SCRIPT}'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  }
});

const rl = readline.createInterface({ input: proc.stdout });

// MCP initialize
proc.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', clientInfo: { name: 'hook', version: '1.0' }, capabilities: {} }
}) + '\n');

let initialized = false;
let result = null;

rl.on('line', async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }

  if (msg.id === 1 && !initialized) {
    initialized = true;
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: {
        name: 'atlas_start_session',
        arguments: {
          repoPath: '${REPO_ROOT}',
          repoName: '${REPO_NAME}',
          agentId: 'claude-code'
        }
      }
    }) + '\n');
  } else if (msg.id === 2) {
    result = msg.result;
    proc.stdin.end();
  }
});

proc.on('close', () => {
  if (result?.content?.[0]?.text) {
    console.log(result.content[0].text);
  } else {
    console.log('{}');
  }
});
EOF
2>/dev/null || echo '{}')

# Parse sessionId and repoId, persist for Stop hook
SESSION_ID=$(echo "$CONTEXT_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).sessionId||'')}catch{console.log('')}})" 2>/dev/null || true)
REPO_ID=$(echo "$CONTEXT_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).repoId||'')}catch{console.log('')}})" 2>/dev/null || true)

if [[ -n "$SESSION_ID" ]]; then
  printf '{"sessionId":"%s","repoId":"%s","repoPath":"%s","repoName":"%s"}\n' \
    "$SESSION_ID" "$REPO_ID" "$REPO_ROOT" "$REPO_NAME" > "$SESSION_FILE"
fi

# Build additionalContext markdown from the returned data
CONTEXT_MD=$(echo "$CONTEXT_JSON" | node --input-type=module <<'JSEOF'
import { createInterface } from 'readline';
let raw = '';
const rl = createInterface({ input: process.stdin });
rl.on('line', l => raw += l);
rl.on('close', () => {
  let d;
  try { d = JSON.parse(raw); } catch { process.stdout.write(''); process.exit(0); }
  if (!d.sessionId) { process.exit(0); }
  const lines = ['## Atlas Memory'];
  const ctx = d.context;
  if (ctx?.techStack?.length) lines.push(`**Stack:** ${ctx.techStack.slice(0,4).join(', ')}`);
  if (d.openTasks?.length) {
    lines.push(`**Open tasks (${d.openTasks.length}):** ` + d.openTasks.slice(0,3).map(t=>`${t.kind}: ${t.content}`).join(' · '));
  }
  if (d.recentDecisions?.length) {
    lines.push(`**Last decision:** ${d.recentDecisions[0].title}`);
  }
  if (d.lastSession?.summary) {
    lines.push(`**Last session:** ${d.lastSession.summary}`);
  }
  if (d.suggestions?.length) {
    lines.push(`**Suggested:** ${d.suggestions[0].action}`);
  }
  lines.push('Type `/atlas` to see the full welcome box.');
  process.stdout.write(lines.join('\n'));
});
JSEOF
2>/dev/null || true)

if [[ -n "$CONTEXT_MD" ]]; then
  # Emit as additionalContext — Claude Code injects this silently into system prompt
  printf '{"type":"additionalContext","content":%s}\n' \
    "$(printf '%s' "$CONTEXT_MD" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.stringify(d)))" 2>/dev/null || echo '""')"
fi
