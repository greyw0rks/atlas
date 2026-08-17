#!/usr/bin/env bash
# Atlas auto-fire hook for Claude Code SessionStart.
# Prints repository context to stdout so it's injected into the new session
# without the agent having to call atlas_start_session manually first.
#
# Install: see scripts/install-autofire.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ATLAS_DIR="$REPO_ROOT/.atlas"
ATLAS_MD="$REPO_ROOT/ATLAS.md"

if [[ -f "$ATLAS_MD" ]]; then
  echo "## Atlas memory (from ATLAS.md)"
  echo ""
  cat "$ATLAS_MD"
  echo ""
  echo "_Call atlas_start_session(repoPath=\"$REPO_ROOT\", ...) to log this session and refresh the above._"
  exit 0
fi

if [[ -d "$ATLAS_DIR" ]]; then
  echo "## Atlas memory (from .atlas/ projection)"
  echo ""
  [[ -f "$ATLAS_DIR/context.md" ]] && cat "$ATLAS_DIR/context.md" && echo ""
  [[ -f "$ATLAS_DIR/todos.md" ]] && cat "$ATLAS_DIR/todos.md" && echo ""
  [[ -f "$ATLAS_DIR/decisions.md" ]] && cat "$ATLAS_DIR/decisions.md" && echo ""
  latest_session=$(ls -t "$ATLAS_DIR/sessions" 2>/dev/null | head -1 || true)
  if [[ -n "$latest_session" ]]; then
    echo "## Last session handoff ($latest_session)"
    echo ""
    cat "$ATLAS_DIR/sessions/$latest_session"
  fi
  exit 0
fi

# No prior Atlas data for this repo — nothing to inject, stay silent.
exit 0
