import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BUILT_INS = new Set([
  'fs', 'path', 'crypto', 'util', 'stream', 'events', 'buffer', 'url',
  'os', 'http', 'https', 'net', 'zlib', 'child_process', 'cluster',
  'assert', 'dns', 'readline', 'tls', 'vm', 'worker_threads'
]);

async function fixImports(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await fixImports(fullPath);
    } else if (entry.name.endsWith('.js')) {
      let content = await readFile(fullPath, 'utf-8');

      // Fix relative imports: add .js if missing
      content = content.replace(
        /from\s+["'](\..+?)["']/g,
        (match, path) => {
          if (path.endsWith('.js') || path.endsWith('.json')) {
            return match;
          }
          return `from "${path}.js"`;
        }
      );

      // Fix local imports resolved by tsc-alias: add .js if missing
      content = content.replace(
        /from\s+["'](\.\..+?)["']/g,
        (match, path) => {
          if (path.endsWith('.js') || path.endsWith('.json')) {
            return match;
          }
          return `from "${path}.js"`;
        }
      );

      await writeFile(fullPath, content);
    }
  }
}

await fixImports('dist');
console.log('✓ Fixed ESM imports');
