# AGENTS.md

WxEcho 项目的 Claude Code Agent 工作规范与上下文文档。

---

## 项目介绍

**WxEcho** — macOS 微信聊天记录一键解密导出工具。

从运行中的微信进程提取数据库密钥（SQLCipher 4 / AES-256-CBC），解密本地 WCDB SQLite 数据库，导出为 TXT / CSV / JSON 格式。长期愿景是做成一个**聊天数据产品**，陆续支持聊天统计、年度报告等情感化功能。

**核心价值主张**：回声，你的聊天记录完整回响。
**设计语言**：微信浅绿色（`#07c160`）+ Mac 高级感，温暖而有节制。

### 技术栈

| 层次 | 技术 |
|------|------|
| CLI 封装 | TypeScript + Commander.js + esbuild |
| 核心逻辑 | Python 3（解密 / 导出） |
| 内存扫描 | C + Mach VM API（`find_all_keys_macos`） |
| 数据库 | SQLite / WCDB / SQLCipher 4 |
| 展示端 | React 18 + Vite（landing page） |

### 支持版本

- macOS 11+（Apple Silicon & Intel）
- WeChat 4.x（已测试 WeChat 4.1.5.240）

---

## 文件目录

```
WxEcho/
├── bin/                        # CLI launcher script（npm 全局安装后为 wxecho 命令入口）
├── src/                        # TypeScript CLI 源码
│   ├── cli.ts                  # 主入口（Commander.js）
│   ├── commands/
│   │   ├── export.ts           # wxecho export — 列出/导出聊天记录
│   │   ├── decrypt.ts          # wxecho decrypt — 解密数据库
│   │   └── keys.ts             # wxecho keys — 从微信进程提取密钥
│   └── utils/
│       ├── doctor.ts            # wxecho doctor — 环境依赖检测
│       └── python.ts            # Python 子进程封装
├── py/                         # Python 核心逻辑
│   ├── config.py               # 配置加载与自动检测
│   ├── decrypt_db.py           # SQLCipher 数据库解密
│   ├── export_chat.py           # 聊天记录导出（TXT/CSV/JSON）
│   ├── key_utils.py             # 密钥文件处理
│   ├── find_all_keys_macos.c    # C 内存扫描器源码
│   ├── find_all_keys_macos      # 编译后的二进制
│   ├── decrypted/               # 解密后数据库输出目录（gitignored）
│   └── exported/                # 导出文件输出目录（gitignored）
├── landing/                     # React landing page
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/           # Hero / Features / Steps / Footer
│   │   └── styles/index.css     # WeChat 绿色主题，亮/暗模式
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── build-cli.ts             # esbuild CLI 打包脚本
│   └── postinstall.sh           # npm install 后自动安装 Python 依赖 + 编译 C 扫描器
├── dist/                        # 构建产物
│   ├── cli.js
│   └── landing/
├── package.json                 # npm 包配置（name: wxecho, version: 1.0.0）
├── tsconfig.json
└── README.md
```

### npm scripts（根目录）

```bash
npm run build        # 构建 CLI → dist/cli.js
npm run build:landing # 构建 landing page → dist/landing/
npm run build:all    # 同时构建 CLI + landing
npm run dev          # 直接用 tsx 运行 CLI（无需 build）
npm run typecheck    # TypeScript 类型检查
npm run postinstall  # 自动安装 Python 依赖 + 编译 C 扫描器
```

### 发布文件（npm publish）

```
dist/, bin/, py/*.py, py/*.c, py/find_all_keys_macos
```

---

## AGENT Workflow

### 工作目录约定

所有 agent 工作产物放在 `~/agents/`（即 `$HOME/agents/`），**不在本仓库内**。

```
~/agents/
├── briefs/           # 任务简报（本次会话要做什么）
├── handoffs/         # 中间态笔记、可续记的上下文
│   ├── WORKLOG.md    # 核心工作日志（必须）
│   └── runtime_logs/ # 运行时日志目录（必须）
├── reports/          # 最终报告
├── context/          # 可复用上下文文档
└── scratch/          # Agent 一次性输出（用完即弃）
```

### 任务发起流程

1. **创建 brief** → `~/agents/briefs/<task-name>.md`，写清楚目标、约束、验收标准
2. **创建 worklog 入口** → 用 `log_work.sh` 记录 planned 状态
3. **执行工作** → 结果写入 `~/agents/handoffs/` 或 `~/agents/scratch/`
4. **完成后更新 worklog** → 状态改为 done，summary 写明成果
5. **如有需要** → 将可复用知识沉淀到 `~/agents/context/`，将最终报告放入 `~/agents/reports/`

---

## 核心规范

### WORKLOG.md

**必须写**，路径：`~/agents/handoffs/WORKLOG.md`

### runtime_logs

**必须放**，路径：`~/agents/handoffs/runtime_logs/<task-name>_<timestamp>.log`

### Append-only 原则

- 只**追加**新条目，**不修改**旧条目
- 例外：发现自己最新条目有事实错误，可以纠正
- 每次开始持久工作、遇到 blocker、完成或暂停有进展时，都应写 entry

### Entry 格式（每条必含）

```
### <UTC ISO 8601 时间戳> | <actor> | <status>
- Summary: <一句话描述>
- Paths: <涉及的本仓库路径，如有>
- Commands: <执行的命令，如有>
- Artifacts: <生成的产物路径，如有>
- Blockers: <阻塞因素，如有>
- Next: <下一步计划>
```

**status 可选值**：`planned` | `in_progress` | `blocked` | `done` | `cancelled`

### 禁止记录 Secret

token、密码、key 等**只记名称，不记内容**。

---

## log_work.sh

纯 Bash 脚本，核心逻辑：解析参数 → 校验 → append 到 WORKLOG。

```bash
#!/usr/bin/env bash
set -euo pipefail

WORKLOG="${WORKLOG_PATH:-$HOME/agents/handoffs/WORKLOG.md}"
ACTOR="${WORKLOG_ACTOR:-${USER:-unknown}}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --actor)    ACTOR="$2";    shift 2 ;;
    --status)   STATUS="$2";   shift 2 ;;
    --summary)  SUMMARY="$2";  shift 2 ;;
    --paths)    PATHS="$2";    shift 2 ;;
    --commands) COMMANDS="$2"; shift 2 ;;
    --artifacts) ARTIFACTS="$2"; shift 2 ;;
    --blockers) BLOCKERS="$2"; shift 2 ;;
    --next)     NEXT_STEP="$2"; shift 2 ;;
    -h|--help)  printf 'Usage: log_work.sh [--actor A] [--status S] [--summary T] [--paths P] [--commands C] [--artifacts A] [--blockers B] [--next N]\n'; exit 0 ;;
    *)          printf 'Unknown arg: %s\n' "$1" >&2; exit 1 ;;
  esac
done

case "$STATUS" in
  planned|in_progress|blocked|done|cancelled) ;;
  *) printf 'Invalid --status\n' >&2; exit 1 ;;
esac
[[ -z "$SUMMARY" ]] && printf 'Missing --summary\n' >&2 && exit 1

timestamp="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
mkdir -p "$(dirname "$WORKLOG")" "$HOME/agents/handoffs/runtime_logs"

cat >> "$WORKLOG" <<EOF

### ${timestamp} | ${ACTOR} | ${STATUS}
- Summary: ${SUMMARY}
- Paths: ${PATHS}
- Commands: ${COMMANDS}
- Artifacts: ${ARTIFACTS}
- Blockers: ${BLOCKERS}
- Next: ${NEXT_STEP}
EOF
```

**安装建议**：`cp log_work.sh ~/bin/log_work.sh && chmod +x ~/bin/log_work.sh`

### 使用示例（WxEcho 相关）

```bash
~/bin/log_work.sh \
  --actor claude \
  --status planned \
  --summary "设计 WxEcho 聊天年度报告功能架构" \
  --paths "landing/src/components/ chat-stat-api/" \
  --commands "" \
  --artifacts "" \
  --blockers "需先确认数据模型和 API 接口设计" \
  --next "调研 WeChat 表情包/聊天数据可视化方案"

~/bin/log_work.sh \
  --actor claude \
  --status in_progress \
  --summary "实现年度聊天报告 React 组件" \
  --paths "landing/src/components/AnnualReport.tsx" \
  --commands "npm run dev" \
  --artifacts "~/agents/handoffs/runtime_logs/annual_report_dev.log" \
  --blockers "none" \
  --next "对接后端 API 获取统计数据"

~/bin/log_work.sh \
  --actor claude \
  --status done \
  --summary "完成 AnnualReport 组件 v0.1，支持消息数/词云/最活跃联系人" \
  --paths "landing/src/components/AnnualReport.tsx landing/src/styles/index.css" \
  --commands "npm run build:landing" \
  --artifacts "dist/landing/annual_report.js" \
  --blockers "none" \
  --next "添加暗模式适配和动画效果"
```

---

## 目录说明

### agents/briefs/

任务简报目录。每次发起新任务时，在此创建 `<task-name>.md>`，包含：

- 背景与目标
- 约束条件
- 验收标准
- 关联的 context 文件（如有）

### agents/handoffs/

中间态笔记与可续记的上下文。当工作因时间限制需要中断时，在这里记录足够让下次接续的上下文。

**必须文件**：`WORKLOG.md`（见上）
**必须目录**：`runtime_logs/`

### agents/reports/

最终报告。任务完成后，将工作总结或研究成果写入此目录，格式不限（Markdown / JSON / 图片等）。

### agents/context/

可复用的上下文文档。例如：某类问题的解决方案、API 设计决策、UI 组件规范等。写入一次，可被多个 future brief 引用。

### agents/scratch/

Agent 一次性输出。用完即弃的临时产物，例如：debug 输出、实验性代码片段、临时分析等。**不建议**在其中进行持久工作。

---

## 产品与设计规范

### UI 设计语言（适用于 landing page 及所有前端产物）

- **主色调**：`#07c160`（微信绿）
- **渐变**：`linear-gradient(135deg, #07c160 0%, #10b063 100%)`
- **背景（亮色）**：`#ffffff` / `#fafbfc`
- **文字主色**：`#1a1a1a`
- **次要文字**：`#8590a6`
- **暗色模式**：通过 `[data-theme='dark']` 覆盖变量，背景切换为 `#0d1117` / `#161b22`
- **字体**：系统字体栈（ui-sans-serif / ui-serif / ui-monospace）
- **风格**：Mac 高级感，圆角卡片，柔和阴影，hover 时绿色微光
- **情感调性**：温暖、有节制、不喧闹

### 产品路线图方向（规划时参考）

- [ ] 聊天记录导出（TXT/CSV/JSON）— 已有
- [ ] 聊天统计（消息数 Top、活跃时段、常用词）
- [ ] 年度聊天报告（情感化可视化）
- [ ] 更多媒体类型支持（图片、语音、视频）
- [ ] 跨平台支持（Windows 待定）

### 前端架构约定

- React 18 + Vite
- 组件放在 `landing/src/components/`
- 样式集中在 `landing/src/styles/index.css`（CSS 变量驱动主题）
- 暗模式通过 `data-theme` 属性切换

---

## 环境依赖

- Node.js >= 18.0.0
- Python >= 3.8
- Xcode Command Line Tools（编译 C 扫描器用）
- macOS（仅支持 darwin）
- 微信需重签（去掉 Hardened Runtime）才可提取密钥
