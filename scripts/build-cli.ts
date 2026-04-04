import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

async function buildCli() {
  // Bundle CLI with esbuild in ESM format
  const result = await esbuild.build({
    entryPoints: [resolve(rootDir, 'src/cli.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: resolve(rootDir, 'dist/cli.js'),
    format: 'esm',
    sourcemap: false,
    minify: false,
    // Keep Node.js built-ins as external so they work with ESM imports
    external: [
      'commander',
    ],
    // Banner to make it work properly
    banner: {
      js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
    },
  });

  if (result.errors.length > 0) {
    console.error('构建失败:', result.errors);
    process.exit(1);
  }

  console.log('✓ CLI 构建完成: dist/cli.js');
}

buildCli().catch((err) => {
  console.error('构建失败:', err);
  process.exit(1);
});
