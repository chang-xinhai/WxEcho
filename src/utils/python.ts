import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PY_DIR = path.resolve(__dirname, '../../py');

export function runPythonScript(
  scriptName: 'export_chat.py' | 'decrypt_db.py',
  args: string[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(PY_DIR, scriptName);
    const child = spawn('python3', [scriptPath, ...args], {
      cwd: PY_DIR,
      stdio: 'inherit',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python 脚本退出，代码: ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`启动 Python 失败: ${error.message}`));
    });
  });
}
