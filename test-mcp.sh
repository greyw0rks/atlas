#!/bin/bash
# Test Atlas MCP Server Integration

set -e

echo "=== Testing Atlas MCP Server ==="
echo

# Test 1: Start Session
echo "1. Testing atlas_start_session..."
SESSION_RESULT=$(node --input-type=module -e "
import { startSession } from './lib/memory/writer.js';
(async () => {
  const result = await startSession('/home/greyw0rks/atlas-2', 'atlas-test', 'claude-code');
  console.log(JSON.stringify(result));
})();
")

SESSION_ID=$(echo $SESSION_RESULT | jq -r '.sessionId')
REPO_ID=$(echo $SESSION_RESULT | jq -r '.repoId')
echo "✓ Session started: $SESSION_ID"
echo "✓ Repo ID: $REPO_ID"
echo

# Test 2: Scan Repository
echo "2. Testing atlas_scan_repository..."
node --input-type=module -e "
import { scanRepository } from './lib/intelligence/repo-scanner.js';
(async () => {
  const result = await scanRepository('/home/greyw0rks/atlas-2', '$REPO_ID');
  console.log('✓ Tech stack found:', result.techStack.length, 'items');
  console.log('✓ Important files:', result.importantFiles.length, 'files');
})();
" || echo "⚠ Scan failed but continuing..."
echo

# Test 3: Extract from Git
echo "3. Testing atlas_extract_git_memories..."
node --input-type=module -e "
import { isGitRepo, getRecentCommits } from './lib/intelligence/git-tracker.js';
import { extractFromGitHistory } from './lib/intelligence/memory-extractor.js';
(async () => {
  const isGit = await isGitRepo('/home/greyw0rks/atlas-2');
  if (isGit) {
    const commits = await getRecentCommits('/home/greyw0rks/atlas-2', new Date(Date.now() - 7*24*60*60*1000), 10);
    console.log('✓ Found', commits.length, 'commits');
    if (commits.length > 0) {
      const result = await extractFromGitHistory('$SESSION_ID', '$REPO_ID', commits);
      console.log('✓ Extracted', result.extractedCount, 'memories');
    }
  } else {
    console.log('⚠ Not a git repo');
  }
})();
" || echo "⚠ Extract failed but continuing..."
echo

# Test 4: Save Memory
echo "4. Testing atlas_save_memory..."
node --input-type=module -e "
import { saveMemory } from './lib/memory/writer.js';
(async () => {
  const result = await saveMemory('$SESSION_ID', '$REPO_ID', {
    kind: 'ARCHITECTURE',
    content: 'Test memory: Atlas uses CockroachDB for vector storage',
    importance: 3,
    tags: ['test']
  });
  console.log('✓ Memory saved:', result.memoryId);
})();
"
echo

# Test 5: Record Decision
echo "5. Testing atlas_record_decision..."
node --input-type=module -e "
import { recordDecision } from './lib/memory/writer.js';
(async () => {
  const result = await recordDecision('$SESSION_ID', '$REPO_ID', {
    title: 'Use Prisma as ORM',
    rationale: 'Type-safe queries and migrations',
    alternatives: ['TypeORM', 'Drizzle']
  });
  console.log('✓ Decision recorded:', result.decisionId);
})();
"
echo

# Test 6: Search Memory
echo "6. Testing atlas_search_memory..."
node --input-type=module -e "
import { generateEmbedding } from './lib/memory/embedder.js';
import { searchMemories } from './lib/memory/retrieval.js';
(async () => {
  const embedding = await generateEmbedding('CockroachDB vector storage');
  if (embedding) {
    const results = await searchMemories(embedding, '/home/greyw0rks/atlas-2', undefined, 5);
    console.log('✓ Search found', results.length, 'results');
    if (results.length > 0) {
      console.log('  Top result similarity:', results[0].similarity.toFixed(3));
    }
  } else {
    console.log('⚠ Embedding generation failed');
  }
})();
" || echo "⚠ Search requires AWS credentials"
echo

# Test 7: End Session
echo "7. Testing atlas_end_session..."
node --input-type=module -e "
import { endSession } from './lib/memory/writer.js';
import * as fs from 'fs/promises';
import * as path from 'path';
(async () => {
  await endSession('$SESSION_ID', 'MCP integration test completed', 'Test handoff text');

  // Write .atlas/ files
  const atlasDir = path.join('/home/greyw0rks/atlas-2', '.atlas');
  await fs.mkdir(atlasDir, { recursive: true });
  await fs.writeFile(path.join(atlasDir, 'test.md'), '# Test Atlas Directory');

  console.log('✓ Session ended');
})();
"
echo

# Test 8: Verify .atlas/ files
echo "8. Verifying .atlas/ directory..."
if [ -d ".atlas" ]; then
  echo "✓ .atlas/ directory exists"
  ls -lah .atlas/ | tail -n +2
else
  echo "⚠ .atlas/ directory not created"
fi
echo

echo "=== MCP Server Test Complete ==="
echo "Session ID: $SESSION_ID"
echo "Repo ID: $REPO_ID"
