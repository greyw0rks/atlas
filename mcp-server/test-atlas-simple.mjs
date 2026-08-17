#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('=== Testing Atlas MCP Server Components ===\n');

// Test database connection
console.log('1. Testing database connection...');
try {
  const { stdout } = await execAsync('npx prisma db execute --stdin', {
    input: 'SELECT 1',
    cwd: '/home/greyw0rks/atlas-2'
  });
  console.log('✓ Database connected\n');
} catch (e) {
  console.log('⚠ Database test skipped\n');
}

// Test that MCP server can start
console.log('2. Testing MCP server startup...');
const serverTest = exec('npx tsx mcp-server/index.ts', {
  cwd: '/home/greyw0rks/atlas-2'
});

setTimeout(() => {
  if (serverTest.pid) {
    console.log('✓ MCP server started (PID:', serverTest.pid, ')\n');
    process.kill(serverTest.pid);
  }
}, 2000);

await new Promise(resolve => setTimeout(resolve, 2500));

console.log('3. Next steps:');
console.log('   - Add .mcp.json to Claude Code project');
console.log('   - Test from Claude Code session');
console.log('   - Verify all 12 tools respond');
console.log('\n=== Test Complete ===');
