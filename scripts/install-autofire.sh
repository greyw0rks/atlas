#!/usr/bin/env bash
# Install Atlas auto-fire hook into Claude Code settings.
# Runs atlas-autofire.sh on every SessionStart, injecting .atlas/ or ATLAS.md
# context into the new session automatically.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOFIRE="$SCRIPT_DIR/atlas-autofire.sh"
SETTINGS="$HOME/.config/claude-code/settings.json"

chmod +x "$AUTOFIRE"

mkdir -p "$(dirname "$SETTINGS")"

if [[ ! -f "$SETTINGS" ]]; then
  cat > "$SETTINGS" <<EOF
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$AUTOFIRE"
          }
        ]
      }
    ]
  }
}
EOF
  echo "Created $SETTINGS with Atlas auto-fire hook."
  exit 0
fi

# Settings file exists — check if hook already present
if grep -q "atlas-autofire" "$SETTINGS"; then
  echo "Atlas auto-fire hook already installed in $SETTINGS."
  exit 0
fi

echo ""
echo "Atlas auto-fire hook NOT automatically merged (settings.json already exists)."
echo ""
echo "Manually add the following to your SessionStart hooks in $SETTINGS:"
echo ""
cat <<EOF
"hooks": {
  "SessionStart": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$AUTOFIRE"
        }
      ]
    }
  ]
}
EOF
