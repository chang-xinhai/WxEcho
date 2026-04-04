#!/usr/bin/env node

import { Command } from 'commander';
import { runExport } from './commands/export.js';
import { runDecrypt } from './commands/decrypt.js';
import { runKeys } from './commands/keys.js';
import { doctor } from './utils/doctor.js';

const program = new Command();

program
  .name('wxecho')
  .description('macOS 微信聊天记录一键解密导出工具')
  .version('1.0.0');

program
  .command('export')
  .description('导出聊天记录')
  .argument('[name]', '联系人昵称或备注（模糊搜索）')
  .option('-u, --username <wxid>', '精确匹配用户名')
  .option('-o, --output <dir>', '输出目录')
  .option('-l, --list', '列出所有会话')
  .option('--top <n>', '列出前 N 个会话', '20')
  .option('--my-wxid <wxid>', '自己的微信 ID')
  .action(runExport);

program
  .command('decrypt')
  .description('解密微信数据库')
  .action(runDecrypt);

program
  .command('keys')
  .description('从微信进程提取数据库密钥（需要 sudo）')
  .option('-o, --output <file>', '输出文件', 'all_keys.json')
  .action(runKeys);

program
  .command('doctor')
  .description('检测环境依赖')
  .action(doctor);

program.parse();
