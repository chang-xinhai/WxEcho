<div align="center">

# WxEcho

**macOS 原生聊天记录导出工具**

[English](./README_en.md) · [中文](./README_zh.md)

---

<p align="center">
  <img src="./landing/public/screenshot_zh.png" alt="WxEcho 界面截图" width="800" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS-11%2B-blue?style=flat-square&logo=apple" />
  <img src="https://img.shields.io/badge/平台-Apple%20Silicon%20%26%20Intel-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/许可证-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Python-3.8%2B-yellow?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Node.js-npm-orange?style=flat-square&logo=npm" />
</p>

> ⚠️ **免责声明**: 本工具仅供个人备份和教育学习使用。使用本工具可能违反相关平台的 服务条款。对于因使用本工具导致的账号封禁、数据丢失或法律后果，作者不承担任何责任。使用前请自行评估风险。

</div>

---

<h2 align="center">✨ 功能特性</h2>

<div align="center">

| 功能 | 描述 |
|------|------|
| 🔑 **密钥提取** | 直接从运行进程内存中提取加密密钥 |
| 🔓 **数据库解密** | 解密 SQLCipher 4 (AES-256-CBC) 加密的数据库 |
| 📤 **多格式导出** | 支持导出为 TXT / CSV / JSON 格式 |
| 🔍 **模糊搜索** | 通过昵称或备注搜索联系人 |
| 💬 **群聊支持** | 完整支持群聊会话导出 |
| 🍎 **原生 macOS** | 基于 Mach VM API 构建，支持 Apple Silicon 和 Intel |

</div>

---

<h2 align="center">🚀 快速开始</h2>

### 环境要求

<div align="center">

macOS 11+ · 桌面应用 4.x (已登录，聊天记录已同步) · Xcode Command Line Tools · Python 3.8+

</div>

### 安装

```bash
npm install -g wxecho
```

或手动安装：

```bash
git clone https://github.com/chang-xinhai/WxEcho.git
cd WxEcho
npm install && npm run build
```

### 使用方法

```bash
# 步骤 1: 重新签名应用
sudo codesign --force --deep --sign - /Applications/WeChat.app

# 重新打开并登录
```

> **替代方案：** 关闭 SIP（`csrutil disable`），则无需重签，但影响范围更大。

```bash
# 步骤 2: 提取密钥
wxecho keys

# 步骤 3: 解密数据库
wxecho decrypt

# 步骤 4: 导出聊天记录
wxecho export -l                    # 列出所有会话
wxecho export -n "张三"            # 按名称导出
```

---

<h2 align="center">📦 版本支持</h2>

<div align="center">

| 微信版本 | 状态 |
|----------|------|
| 4.x（最新测试：4.1.7.1） | ✅ 已测试 |
| 4.1.5.240 | ✅ 已测试 |

npm 包最后更新：2026-04-06（v1.1.1）

</div>

---

<h2 align="center">⚙️ 工作原理</h2>

<div align="center">

```
运行中的应用进程 ──密钥提取──▶ keys.json ──解密──▶ 明文 SQLite ──导出──▶ TXT/CSV/JSON
   (SQLCipher 4)                     (AES-256-CBC)      (.db 文件)       (聊天记录)
```

应用使用 [WCDB](https://github.com/nicklockwood/wcdb)（基于 SQLCipher 4），每个数据库的 AES-256 密钥缓存在进程内存中，存储格式为 `x'<64hex_key><32hex_salt>'`。

</div>

---

<h2 align="center">📋 命令行工具</h2>

<div align="center">

| 命令 | 描述 |
|------|------|
| `wxecho keys` | 从运行中的进程提取数据库密钥 |
| `wxecho decrypt` | 解密本地数据库 |
| `wxecho export [options]` | 导出聊天记录 |
| `wxecho doctor` | 检查环境依赖 |

### export 选项

| 选项 | 描述 |
|------|------|
| `-l, --list` | 列出所有会话 |
| `-n, --name <name>` | 按昵称或备注搜索联系人 |
| `-u, --username <wxid>` | 按精确用户名匹配 |
| `-o, --output <dir>` | 指定输出目录 |
| `--top <n>` | 列出前 N 个会话（默认: 20） |
| `--my-wxid <wxid>` | 自己的用户 ID（省略时自动检测） |

</div>

---

<h2 align="center">📁 数据库结构</h2>

<div align="center">

解密后的数据库位于 `py/decrypted/`：

</div>

```
decrypted/
├── contact/contact.db          # 联系人
├── session/session.db          # 会话列表
├── message/message_0.db        # 聊天消息（按时间分片）
├── message/message_fts.db     # 全文搜索索引
├── message/media_0.db         # 语音消息
├── sns/sns.db                  # 朋友圈
├── favorite/favorite.db        # 收藏
└── ...
```

<div align="center">

每个联系人/群聊的消息存储在名为 `Msg_<md5(username)>` 的表中。

</div>

---

<h2 align="center">❓ 常见问题</h2>

<details>
<summary><strong>Q: `task_for_pid failed` 怎么办？</strong></summary>

A: 请确保：(1) 应用已使用 ad-hoc 签名重签；(2) 应用正在运行且已登录。
</details>

<details>
<summary><strong>Q: 更新应用后还能用吗？</strong></summary>

A: 更新会恢复原始代码签名，请重新运行签名步骤。
</details>

<details>
<summary><strong>Q: 为什么有些消息显示 `[Compressed Content]`？</strong></summary>

A: 部分消息使用 zstd 压缩。大多数文本消息不受影响。
</details>

<details>
<summary><strong>Q: 如何导出图片/视频/音频？</strong></summary>

A: 本工具仅导出文本记录。媒体文件在 `xwechat_files/.../Message/`，可通过 `message_resource.db` 关联。
</details>

<details>
<summary><strong>Q: 支持群聊吗？</strong></summary>

A: 支持。导出方式相同，每条消息会显示发送者的真实昵称/备注。
</details>

---

<h2 align="center">🔗 相关项目</h2>

<div align="center">

| 项目 | 描述 |
|------|------|
| [ydotdog/wechat-export-macos](https://github.com/ydotdog/wechat-export-macos) | 参考项目 |
| [L1en2407/wechat-decrypt](https://github.com/L1en2407/wechat-decrypt) | C 内存扫描器 |
| [Thearas/wechat-db-decrypt-macos](https://github.com/Thearas/wechat-db-decrypt-macos) | lldb 密钥提取 |
| [ylytdeng/wechat-decrypt](https://github.com/ylytdeng/wechat-decrypt) | 原始内存搜索 |

</div>

---

<h2 align="center">📜 许可证</h2>

<div align="center">

MIT License

</div>

---

<p align="center">
  用 ❤️ 制作 by <a href="https://github.com/chang-xinhai">chang-xinhai</a>
</p>