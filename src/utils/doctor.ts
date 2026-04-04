import { execSync } from 'child_process';

export async function doctor(): Promise<void> {
  console.log('正在检测环境依赖...\n');

  const checks = [
    { name: 'Python 3', cmd: 'python3 --version', required: true },
    { name: 'Xcode Command Line Tools', cmd: 'xcode-select -p', required: true },
    { name: '微信进程', cmd: 'pgrep -x WeChat', required: true },
    { name: 'pycryptodome', cmd: 'python3 -c "import Crypto; print(Crypto.__version__)"', required: true },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const output = execSync(check.cmd, { stdio: 'pipe' }).toString().trim();
      console.log(`✓ ${check.name}: ${output}`);
    } catch {
      if (check.required) {
        console.log(`✗ ${check.name} - 未通过`);
        allPassed = false;
      } else {
        console.log(`⚠ ${check.name} - 可选`);
      }
    }
  }

  console.log('\n--- 检查结果 ---');

  if (allPassed) {
    console.log('✓ 环境就绪！可以开始使用。\n');
    console.log('使用步骤：');
    console.log('  1. wxecho keys      # 提取密钥（需要 sudo）');
    console.log('  2. wxecho decrypt   # 解密数据库');
    console.log('  3. wxecho export -l # 列出所有会话');
    console.log('  4. wxecho export -n "联系人"  # 导出聊天');
  } else {
    console.log('✗ 环境检查未通过，请安装缺失的依赖。\n');
    console.log('安装依赖：');
    console.log('  pip install pycryptodome');
    console.log('  xcode-select --install');
    console.log('  重签微信: sudo codesign --force --deep --sign - /Applications/WeChat.app');
  }
}
