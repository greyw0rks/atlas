import { startSession, saveMemory, recordDecision, endSession } from './lib/memory/writer.js';
import { getRepositoryContext } from './lib/memory/retrieval.js';
import { scanRepository } from './lib/intelligence/repo-scanner.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function testAtlasLifecycle() {
  console.log('=== Testing Atlas Session Lifecycle ===\n');

  console.log('1. Starting session...');
  const { sessionId, repoId } = await startSession(
    '/home/greyw0rks/atlas-2',
    'atlas-2',
    'claude-code-test'
  );
  console.log(`✓ Session started: ${sessionId}`);
  console.log(`✓ Repo ID: ${repoId}\n`);

  console.log('2. Scanning repository...');
  const scanResult = await scanRepository('/home/greyw0rks/atlas-2', repoId);
  console.log(`✓ Found ${scanResult.techStack.length} tech stack items`);
  console.log(`✓ Found ${scanResult.importantFiles.length} important files\n`);

  console.log('3. Saving test memory...');
  const memoryResult = await saveMemory(sessionId, repoId, {
    kind: 'ARCHITECTURE',
    content: 'Atlas 2.0 uses CockroachDB for persistent vector storage with AWS Bedrock embeddings',
    importance: 4,
    tags: ['test', 'architecture']
  });
  console.log(`✓ Memory saved: ${memoryResult.memoryId}\n`);

  console.log('4. Recording decision...');
  const decisionResult = await recordDecision(sessionId, repoId, {
    title: 'Use MCP for agent integration',
    rationale: 'Model Context Protocol provides standardized tool interface for Claude Code',
    alternatives: ['Custom API', 'Direct SDK integration']
  });
  console.log(`✓ Decision recorded: ${decisionResult.decisionId}\n`);

  console.log('5. Getting repository context...');
  const context = await getRepositoryContext('/home/greyw0rks/atlas-2');
  console.log(`✓ Context loaded`);
  if (context?.context) {
    console.log(`  - Tech stack: ${context.context.techStack.length} items`);
    console.log(`  - Important files: ${context.context.importantFiles.length} files`);
  }
  console.log();

  console.log('6. Ending session...');
  await endSession(sessionId, 'Test session completed successfully', 
    '# Test Handoff\n\nThis was a test of the Atlas MCP server lifecycle.');
  console.log(`✓ Session ended\n`);

  console.log('7. Writing .atlas/ projection files...');
  const atlasDir = join('/home/greyw0rks/atlas-2', '.atlas');
  await mkdir(atlasDir, { recursive: true });
  await writeFile(join(atlasDir, 'test-session.md'), 
    `# Test Session\n\nSession ID: ${sessionId}\nRepo ID: ${repoId}\n\nTest completed successfully.`);
  console.log(`✓ .atlas/ directory created\n`);

  console.log('=== All Tests Passed ===');
  console.log(`Session ID: ${sessionId}`);
  console.log(`Repo ID: ${repoId}`);
}

testAtlasLifecycle().catch(console.error);
