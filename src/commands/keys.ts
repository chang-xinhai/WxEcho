import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Use WXECHO_ROOT from bin/wxecho launcher if set (for global npm install with symlinks)
const PKG_ROOT = process.env.WXECHO_ROOT
  ? path.resolve(process.env.WXECHO_ROOT)
  : path.resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PY_DIR = path.join(PKG_ROOT, 'py');

export async function runKeys(this: Command): Promise<void> {
  const opts = this.opts() as { output?: string };
  const outputFile = opts.output || 'all_keys.json';
  const binaryPath = path.join(PY_DIR, 'find_all_keys_macos');

  console.log('正在从微信进程提取密钥...\n');
  console.log('注意：此操作需要：');
  console.log('  1. 微信正在运行且已登录');
  console.log('  2. 已执行重签名的微信（sudo codesign --force --deep --sign - /Applications/WeChat.app）\n');

  // Check if binary exists
  if (!fs.existsSync(binaryPath)) {
    console.log('编译密钥扫描器...');
    await compileBinary();
  }

  await extractKeys(binaryPath, outputFile);
}

function compileBinary(): Promise<void> {
  return new Promise((resolve, reject) => {
    const compile = spawn('/usr/bin/cc', [
      '-O2',
      '-o', path.join(PY_DIR, 'find_all_keys_macos'),
      path.join(PY_DIR, 'find_all_keys_macos.c'),
      '-framework', 'Foundation'
    ], { cwd: PY_DIR });

    compile.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error('编译失败'));
        return;
      }
      console.log('编译成功，现在运行密钥提取...\n');
      resolve();
    });

    compile.on('error', reject);
  });
}

function extractKeys(binaryPath: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('sudo', [binaryPath], {
      cwd: PY_DIR,
      stdio: 'inherit'
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(`\n密钥已保存到 ${outputFile}`);
        resolve();
      } else {
        reject(new Error(`密钥提取失败，退出码: ${code}`));
      }
    });

    child.on('error', reject);
  });
}
