import { runPythonScript } from '../utils/python.js';

export async function runDecrypt(): Promise<void> {
  console.log('开始解密微信数据库...\n');

  try {
    await runPythonScript('decrypt_db.py', []);
    console.log('\n解密完成！数据库文件位于 ./decrypted/ 目录');
  } catch (error) {
    console.error('解密失败:', error);
    console.log('\n请确保：');
    console.log('  1. 已运行 wxecho keys 提取密钥');
    console.log('  2. 密钥文件 all_keys.json 存在于 py/ 目录');
    process.exit(1);
  }
}
