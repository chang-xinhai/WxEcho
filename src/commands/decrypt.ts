import { runDecrypt, getConfig } from '../utils/decrypt_db.js';

export async function runDecryptCmd(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  WeChat 4.0 Database Decryptor');
  console.log('='.repeat(60));
  console.log();

  const config = getConfig();
  await runDecrypt(config);
}
