/**
 * WeChat 4.0 Database Decryptor
 *
 * Decrypts SQLCipher 4 (AES-256-CBC, HMAC-SHA512) encrypted databases
 * using keys extracted from process memory.
 *
 * Replaces the Python pycryptodome implementation with Node.js native crypto.
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

function getScriptDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

const PAGE_SZ = 4096;
const KEY_SZ = 32;
const SALT_SZ = 16;
const IV_SZ = 16;
const HMAC_SZ = 64;
const RESERVE_SZ = IV_SZ + HMAC_SZ; // 80
const SQLITE_HDR = Buffer.from('SQLite format 3\x00');

export interface DecryptConfig {
  dbDir: string;
  outDir: string;
  keysFile: string;
}

export interface KeyInfo {
  enc_key: string;
}

export type KeysMap = Record<string, KeyInfo>;

// ─── HMAC-SHA512 ─────────────────────────────────────────────────────────────

function deriveMacKey(encKey: Buffer, salt: Buffer): Buffer {
  // mac_salt = salt ^ 0x3a
  const macSalt = Buffer.alloc(SALT_SZ);
  for (let i = 0; i < SALT_SZ; i++) {
    macSalt[i] = salt[i] ^ 0x3a;
  }
  return crypto.pbkdf2Sync(encKey, macSalt, 2, KEY_SZ, 'sha512');
}

// ─── Page decryption ─────────────────────────────────────────────────────────

function decryptPage(encKey: Buffer, pageData: Buffer, pgno: number): Buffer {
  const iv = pageData.subarray(PAGE_SZ - RESERVE_SZ, PAGE_SZ - RESERVE_SZ + IV_SZ);

  let encrypted: Buffer;
  if (pgno === 1) {
    // Page 1: skip 16-byte salt prefix
    encrypted = pageData.subarray(SALT_SZ, PAGE_SZ - RESERVE_SZ);
  } else {
    encrypted = pageData.subarray(0, PAGE_SZ - RESERVE_SZ);
  }

  const cipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  try {
    var decrypted = Buffer.concat([cipher.update(encrypted), cipher.final()]);
  } catch {
    // Fallback: data uses zero-padding (no PKCS#7 padding)
    const cipher2 = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
    cipher2.setAutoPadding(false);
    decrypted = Buffer.concat([cipher2.update(encrypted), cipher2.final()]);
  }

  if (pgno === 1) {
    // Rebuild page: SQLite header + decrypted data + zeroed reserve
    const page = Buffer.alloc(PAGE_SZ);
    SQLITE_HDR.copy(page);
    decrypted.copy(page, SQLITE_HDR.length);
    return page;
  } else {
    const page = Buffer.alloc(PAGE_SZ);
    decrypted.copy(page, 0);
    return page;
  }
}

// ─── Database decryption ─────────────────────────────────────────────────────

function decryptDatabase(
  dbPath: string,
  outPath: string,
  encKeyHex: string,
): boolean {
  const encKey = Buffer.from(encKeyHex, 'hex');
  const fileSize = fs.statSync(dbPath).size;
  const totalPages = Math.ceil(fileSize / PAGE_SZ);

  const fd = fs.openSync(dbPath, 'r');
  try {
    const page1 = Buffer.alloc(PAGE_SZ);
    fs.readSync(fd, page1, 0, PAGE_SZ, 0);

    // Extract salt from page 1
    const salt = page1.subarray(0, SALT_SZ);
    const macKey = deriveMacKey(encKey, salt);

    // Verify page 1 HMAC
    // HMAC data = salt_tail + encrypted_data + pgno_as_u32_le
    // salt_tail = bytes SALT_SZ..(PAGE_SZ-RESERVE_SZ+IV_SZ) of page1
    const p1HmacData = Buffer.concat([
      page1.subarray(SALT_SZ, PAGE_SZ - RESERVE_SZ + IV_SZ),
      Buffer.from([1, 0, 0, 0]), // pgno=1 as little-endian uint32
    ]);
    const computedHmac = crypto.createHmac('sha512', macKey).update(p1HmacData).digest();
    const storedHmac = page1.subarray(PAGE_SZ - HMAC_SZ, PAGE_SZ);

    if (!computedHmac.equals(storedHmac)) {
      console.log(`  [ERROR] Page 1 HMAC mismatch! salt: ${salt.toString('hex')}`);
      return false;
    }

    console.log(`  HMAC OK, ${totalPages} pages`);

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    const outFd = fs.openSync(outPath, 'w');
    try {
      for (let pgno = 1; pgno <= totalPages; pgno++) {
        const pageBuf = Buffer.alloc(PAGE_SZ);
        const bytesRead = fs.readSync(fd, pageBuf, 0, PAGE_SZ, (pgno - 1) * PAGE_SZ);

        if (bytesRead < PAGE_SZ) {
          if (bytesRead > 0) {
            pageBuf.fill(0, bytesRead);
          } else {
            break;
          }
        }

        const decrypted = decryptPage(encKey, pageBuf, pgno);
        fs.writeSync(outFd, decrypted, 0, PAGE_SZ, (pgno - 1) * PAGE_SZ);

        if (pgno === 1 && decrypted.subarray(0, 16).compare(SQLITE_HDR) !== 0) {
          console.log(`  [WARN] Decrypted header mismatch!`);
        }

        if (pgno % 10000 === 0) {
          console.log(`  Progress: ${pgno}/${totalPages} (${(100 * pgno / totalPages).toFixed(1)}%)`);
        }
      }
    } finally {
      fs.closeSync(outFd);
    }
  } finally {
    fs.closeSync(fd);
  }

  return true;
}

// ─── Key file helpers ─────────────────────────────────────────────────────────

function stripKeyMetadata(keys: KeysMap): KeysMap {
  const result: KeysMap = {};
  for (const [k, v] of Object.entries(keys)) {
    if (!k.startsWith('_')) {
      result[k] = v;
    }
  }
  return result;
}

function isSafeRelPath(relPath: string): boolean {
  const normalized = path.normalize(relPath).replace(/\\/g, '/');
  return !normalized.includes('..');
}

function getKeyInfo(keys: KeysMap, relPath: string): KeyInfo | null {
  if (!isSafeRelPath(relPath)) return null;

  const normalized = relPath.replace(/\\/g, '/');
  const variants = [relPath, normalized, normalized.replace('/', '\\')];

  for (const candidate of variants) {
    if (candidate in keys && !candidate.startsWith('_')) {
      return keys[candidate];
    }
  }
  return null;
}

// ─── SQLite verification (pure JS via sql.js) ─────────────────────────────────

// Lazy-loaded to avoid adding a hard dependency for a post-decrypt check
async function verifySqlite(outPath: string): Promise<string[] | null> {
  try {
    const { execSync } = await import('child_process');
    const safePath = outPath.replace(/'/g, "'\\''");
    const output = execSync(
      `python3 -c "import sqlite3; conn=sqlite3.connect('${safePath}'); print(','.join([r[0] for r in conn.execute('SELECT name FROM sqlite_master WHERE type=\\'table\\'').fetchall()]))"`,
      { encoding: 'utf-8' }
    ).trim();
    return output.split(',').filter(Boolean);
  } catch {
    return null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runDecrypt(config: DecryptConfig): Promise<void> {
  const { dbDir, outDir, keysFile } = config;

  if (!fs.existsSync(keysFile)) {
    console.error(`[ERROR] Key file not found: ${keysFile}`);
    console.error('Please run "wxecho keys" first.');
    process.exit(1);
  }

  const keysRaw = JSON.parse(fs.readFileSync(keysFile, 'utf-8'));
  const keys = stripKeyMetadata(keysRaw);

  console.log(`Loaded ${Object.keys(keys).length} database keys`);
  console.log(`Output directory: ${outDir}`);
  fs.mkdirSync(outDir, { recursive: true });

  // Collect all .db files
  const dbFiles: Array<{ rel: string; abs: string; size: number }> = [];

  function walkDir(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(full);
        } else if (
          entry.isFile() &&
          entry.name.endsWith('.db') &&
          !entry.name.endsWith('-wal') &&
          !entry.name.endsWith('-shm')
        ) {
          const rel = path.relative(dbDir, full).replace(/\\/g, '/');
          dbFiles.push({ rel, abs: full, size: fs.statSync(full).size });
        }
      }
    } catch {
      // skip inaccessible dirs
    }
  }

  walkDir(dbDir);
  dbFiles.sort((a, b) => a.size - b.size);

  console.log(`Found ${dbFiles.length} database files\n`);

  let success = 0;
  let failed = 0;
  let totalBytes = 0;

  for (const { rel, abs, size } of dbFiles) {
    const keyInfo = getKeyInfo(keys, rel);
    if (!keyInfo) {
      console.log(`SKIP: ${rel} (no key)`);
      failed++;
      continue;
    }

    const outPath = path.join(outDir, rel);
    process.stdout.write(`Decrypting: ${rel} (${(size / 1024 / 1024).toFixed(1)}MB) ... `);

    const ok = decryptDatabase(abs, outPath, keyInfo.enc_key);
    if (ok) {
      const tables = await verifySqlite(outPath);
      if (tables) {
        const tableNames = tables.slice(0, 5).join(', ');
        const suffix = tables.length > 5 ? ` ...total ${tables.length}` : '';
        console.log(`  OK! Tables: ${tableNames}${suffix}`);
        success++;
        totalBytes += size;
      } else {
        console.log(`  [WARN] SQLite verification failed`);
        failed++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Result: ${success} succeeded, ${failed} failed, ${dbFiles.length} total`);
  console.log(`Decrypted data: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)}GB`);
  console.log(`Decrypted files at: ${outDir}`);
}

// ─── Config loading (mirrors config.py for macOS) ─────────────────────────────

function detectWeChatDbDir(): string | null {
  const home = process.env.HOME || '';
  let bestDir: string | null = null;
  let bestMtime = 0;

  // macOS WeChat stores data in ~/Library/Containers/
  const wechatContainerRoot = path.join(
    home, 'Library', 'Containers', 'com.tencent.xinWeChat', 'Data', 'Documents', 'xwechat_files'
  );

  // Also check ~/Documents as fallback for older installs
  const docsRoot = path.join(home, 'Documents', 'xwechat_files');

  for (const xwechatRoot of [wechatContainerRoot, docsRoot]) {
    if (!fs.existsSync(xwechatRoot)) continue;

    const accounts = fs.readdirSync(xwechatRoot);
    for (const account of accounts) {
      const dbStorage = path.join(xwechatRoot, account, 'db_storage');
      const msgDir = path.join(dbStorage, 'message');
      if (fs.existsSync(msgDir)) {
        try {
          const mtime = fs.statSync(msgDir).mtimeMs;
          if (mtime > bestMtime) {
            bestMtime = mtime;
            bestDir = dbStorage;
          }
        } catch (_) {
          // skip
        }
      }
    }
  }

  return bestDir;
}

export function getConfig(): DecryptConfig {
  // Resolve py directory relative to the installed package location
  // In ESM, __dirname is not available; use import.meta.url instead
  const scriptDir = getScriptDir();
  const pyDir = path.resolve(scriptDir, '..', 'py');
  const keysFile = path.join(pyDir, 'all_keys.json');

  let dbDir = path.join(process.env.HOME || '', 'Documents', 'xwechat_files', 'your_wxid', 'db_storage');

  // Try to load from py/config.json if it exists and has a valid path
  const configJsonPath = path.join(pyDir, 'config.json');
  if (fs.existsSync(configJsonPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configJsonPath, 'utf-8'));
      if (cfg.db_dir && !cfg.db_dir.includes('your_wxid') && fs.existsSync(cfg.db_dir)) {
        dbDir = cfg.db_dir;
      }
    } catch {
      // ignore
    }
  }

  // Auto-detect if using default template path or directory doesn't exist
  if (dbDir.includes('your_wxid') || !fs.existsSync(dbDir)) {
    const detected = detectWeChatDbDir();
    if (detected) {
      dbDir = detected;
      console.log(`[+] Auto-detected WeChat data directory: ${dbDir}`);
    }
  }

  return {
    dbDir,
    outDir: path.join(pyDir, 'decrypted'),
    keysFile,
  };
}
