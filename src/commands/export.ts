import { Command } from 'commander';
import { runPythonScript } from '../utils/python.js';

export function runExport(this: Command, name: string | undefined): Promise<void> {
  const args: string[] = [];

  const opts = this.opts();

  if (opts.list) {
    args.push('-l');
    if (opts.top) args.push('--top', opts.top);
  } else if (name) {
    args.push('-n', name);
  } else {
    console.error('错误：需要提供联系人名称或使用 --list');
    console.log('\n用法示例：');
    console.log('  wxecho export -l                    # 列出所有会话');
    console.log('  wxecho export -n "张三"             # 导出张三的聊天');
    console.log('  wxecho export -u wxid_xxxxx          # 通过用户名导出');
    process.exit(1);
  }

  if (opts.username) args.push('-u', opts.username);
  if (opts.output) args.push('-o', opts.output);
  if (opts.myWxid) args.push('--my-wxid', opts.myWxid);

  return runPythonScript('export_chat.py', args)
    .then(() => {
      // success
    })
    .catch((error) => {
      console.error('导出失败:', error);
      process.exit(1);
    });
}
