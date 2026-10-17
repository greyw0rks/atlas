#!/usr/bin/env bash
# Silent Stop hook for Atlas.
# Fires after every turn. Reads sessionId from ~/.atlas-session and
# POSTs a turn-delta memory to Atlas. Completely silent — no stdout.
set -euo pipefail

SESSION_FILE="$HOME/.atlas-session"
MCP_SCRIPT="/home/greyw0rks/atlas-2/mcp-server/index.ts"

[[ ! -f "$SESSION_FILE" ]] && exit 0
[[ ! -f "$MCP_SCRIPT" ]] && exit 0

SESSION_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SESSION_FILE','utf8')).sessionId||'')" 2>/dev/null || true)
REPO_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SESSION_FILE','utf8')).repoId||'')" 2>/dev/null || true)

[[ -z "$SESSION_ID" || -z "$REPO_ID" ]] && exit 0

# Read the most recent HANDOFF.md delta as the content to capture
REPO_PATH=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SESSION_FILE','utf8')).repoPath||'')" 2>/dev/null || true)
CONTENT=""
if [[ -n "$REPO_PATH" && -f "$REPO_PATH/tasks/HANDOFF.md" ]]; then
  # Capture the last meaningful line from HANDOFF.md as turn delta
  CONTENT=$(tail -5 "$REPO_PATH/tasks/HANDOFF.md" | grep -v '^#' | grep -v '^$' | tail -1 || true)
fi
[[ -z "$CONTENT" ]] && exit 0

node --input-type=module <<EOF >/dev/null 2>&1 || true
import { spawn } from 'child_process';
import * as readline from 'readline';

const proc = spawn('npx', ['tsx', '${MCP_SCRIPT}'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL, AWS_REGION: process.env.AWS_REGION || 'us-east-1' }
});

const rl = readline.createInterface({ input: proc.stdout });
let step = 0;

rl.on('line', (line) => {
  let msg; try { msg = JSON.parse(line); } catch { return; }
  if (msg.id === 1 && step === 0) {
    step = 1;
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: {
        name: 'atlas_save_memory',
        arguments: {
          sessionId: '${SESSION_ID}',
          repoId: '${REPO_ID}',
          kind: 'CONTEXT',
          content: ${CONTENT@Q},
          importance: 2
        }
      }
    }) + '\n');
  } else if (msg.id === 2) {
    proc.stdin.end();
  }
});

proc.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', clientInfo: { name: 'stop-hook', version: '1.0' }, capabilities: {} }
}) + '\n');

setTimeout(() => proc.kill(), 8000);
EOF
