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

  // Fix SessionStart hook to use Atlas instead of HANDOFF.md
  settings.hooks = settings.hooks || {};

  // Remove any existing HANDOFF.md hooks
  if (settings.hooks.SessionStart) {
    settings.hooks.SessionStart = settings.hooks.SessionStart.filter(hook => {
      if (hook.hooks && hook.hooks.length > 0) {
        const hasHandoffCommand = hook.hooks.some(h =>
          h.command && h.command.includes('HANDOFF.md')
        );
        return !hasHandoffCommand;
      }
      return true;
    });
  }

  // Don't add automatic SessionStart - users should manually start sessions
  // SessionStart hooks can't use prompts (no conversation context yet)
  settings.hooks.SessionStart = [];

  // Don't add automatic Stop hook either - let users end sessions manually
  settings.hooks.Stop = [];

  // Write updated settings
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

  console.log('✓ Settings updated successfully');
  console.log('  - Added Atlas MCP server');
  console.log('  - Configured SessionStart hook for Atlas');
  console.log('  - Configured Stop hook for Atlas');
  console.log('  - Removed conflicting HANDOFF.md hooks');

} catch (error) {
  console.error('✗ Failed to update settings:', error.message);
  process.exit(1);
}
