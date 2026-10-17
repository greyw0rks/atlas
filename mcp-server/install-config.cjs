#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

// Default settings structure
const defaultSettings = {
  apiKeyHelper: null,
  env: {},
  permissions: {
    allow: [],
    deny: []
  },
  mcpServers: {},
  hooks: {
    SessionStart: [],
    Stop: []
  },
  effortLevel: "medium",
  skipWorkflowUsageWarning: true,
  theme: "dark"
};

try {
  // Read existing settings or use defaults
  let settings = defaultSettings;

  if (fs.existsSync(SETTINGS_FILE)) {
    const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    settings = JSON.parse(content);
  }

  // Add/update Atlas MCP server
  settings.mcpServers = settings.mcpServers || {};
  settings.mcpServers.atlas = {
    command: "atlas-mcp"
  };

  // Remove only hooks that reference HANDOFF.md; keep everything else the user
  // configured. Never wipe the hooks arrays wholesale.
  settings.hooks = settings.hooks || {};

  const stripHandoffHooks = (hooks) =>
    (hooks || []).filter((hook) => {
      if (!hook.hooks || hook.hooks.length === 0) return true;
      return !hook.hooks.some((h) => h.command && h.command.includes('HANDOFF.md'));
    });

  settings.hooks.SessionStart = stripHandoffHooks(settings.hooks.SessionStart);
  settings.hooks.Stop = stripHandoffHooks(settings.hooks.Stop);

  // Atlas sessions are started by the agent (or /atlas), not by a fire-and-forget
  // shell hook, so no new hook is installed here.

  // Write updated settings
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

  console.log('✓ Settings updated successfully');
  console.log('  - Added Atlas MCP server');
  console.log('  - Removed any hooks that referenced HANDOFF.md');
  console.log('  - Left your other hooks untouched');

} catch (error) {
  console.error('✗ Failed to update settings:', error.message);
  process.exit(1);
}
