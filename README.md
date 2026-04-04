# WxEcho

回声，你的聊天记录完整回响。

macOS 微信聊天记录一键解密导出工具。从运行中的微信进程提取数据库密钥，解密本地 SQLite 数据库，导出为可读的 TXT / CSV / JSON 格式。

支持 **WeChat 4.x**（新版微信），适用于 **macOS (Apple Silicon & Intel)**。

## 安装

### npm 安装（推荐）

```bash
npm install -g wxecho
```

安装后即可全局使用 `wxecho` 命令。

### 手动安装

```bash
git clone https://github.com/chang-xinhai/WxEcho.git
cd WxEcho
npm install
npm run build
```

## 原理

```
微信进程内存 ──提取密钥──▶ all_keys.json ──解密──▶ 明文 SQLite ──导出──▶ TXT/CSV/JSON
   (WCDB/SQLCipher 4)       (AES-256-CBC)          (.db files)         (chat history)
```

微信使用 [WCDB](https://github.com/nicklockwood/wcdb)（基于 SQLCipher 4）加密本地数据库。每个 `.db` 文件有独立的 AES-256 密钥，缓存在进程内存中，格式为 `x'<64hex_key><32hex_salt>'`。本工具通过 Mach VM API 扫描微信进程内存，匹配密钥模式并验证正确性，然后逐页解密数据库。

## 版本支持

| 版本 | 支持状态 |
|------|----------|
| WeChat 4.1.5.240 | ✅ 已测试 |

> 后续版本可能会陆续补充。如遇兼容问题，欢迎提交 Issue。

## 快速开始

### 前置条件

- macOS 11+
- 微信桌面版 4.x（已登录，聊天记录已同步）
- Xcode Command Line Tools：`xcode-select --install`
- Python 依赖会在 postinstall 时自动安装

### 第一步：重签微信（去掉 Hardened Runtime）

```bash
# 先退出微信，然后执行：
sudo codesign --force --deep --sign - /Applications/WeChat.app

# 重新打开微信并登录
```

> **为什么需要重签？** macOS 微信默认带有 Hardened Runtime，阻止其他进程通过 `task_for_pid` 读取其内存。重签为 ad-hoc 签名后移除了这个限制。微信更新后需要重新执行此步骤。
>
> **替代方案：** 关闭 SIP（`csrutil disable`），则无需重签，但影响范围更大。

### 第二步：提取密钥

```bash
# 确保微信正在运行且已登录
sudo wxecho keys
```

输出 `all_keys.json`，包含所有数据库的解密密钥。

### 第三步：解密数据库

```bash
wxecho decrypt
```

解密后的数据库在 `py/decrypted/` 目录下。

### 第四步：导出聊天记录

```bash
# 列出所有会话（按消息数排序）
wxecho export -l

# 导出某个联系人的聊天记录（模糊搜索昵称/备注）
wxecho export -n "张三"

# 指定输出目录
wxecho export -n "张三" -o ~/Downloads/mychat

# 直接指定用户名导出
wxecho export -u wxid_xxxxx
```

导出文件：
- `chat.txt` — 纯文本，可直接阅读
- `chat.csv` — 表格格式，可用 Excel/Numbers 打开
- `chat.json` — 结构化 JSON，适合编程分析

## CLI 命令

| 命令 | 说明 |
|------|------|
| `wxecho export [options] [name]` | 导出聊天记录 |
| `wxecho decrypt` | 解密微信数据库 |
| `wxecho keys` | 从微信进程提取密钥（需 sudo） |
| `wxecho doctor` | 检测环境依赖 |

### export 选项

| 选项 | 说明 |
|------|------|
| `-l, --list` | 列出所有会话 |
| `-n, --name <name>` | 按昵称搜索联系人 |
| `-u, --username <wxid>` | 精确匹配用户名 |
| `-o, --output <dir>` | 指定输出目录 |
| `--top <n>` | 列出前 N 个会话（默认 20） |
| `--my-wxid <wxid>` | 自己的微信 ID |

## 聊天记录迁移提示

Mac 微信默认只保留在 Mac 上收发的消息。如果需要手机上的历史记录：

1. **手机微信** → 设置 → 通用 → 聊天记录迁移与备份 → **迁移到电脑**
2. 选择要迁移的聊天和时间范围
3. Mac 微信扫码接收
4. 迁移完成后重新执行密钥提取和解密

## 数据库结构

解密后的数据库位于 `py/decrypted/`：

```
decrypted/
├── contact/contact.db          # 联系人（昵称、备注、头像URL等）
├── session/session.db          # 会话列表
├── message/message_0.db        # 聊天记录（按时间分片）
├── message/message_1.db
├── message/message_2.db
├── message/message_fts.db      # 全文搜索索引
├── message/media_0.db          # 语音消息
├── sns/sns.db                  # 朋友圈
├── favorite/favorite.db        # 收藏
├── emoticon/emoticon.db        # 表情包
└── ...
```

每个联系人/群的消息存在以 `Msg_<md5(username)>` 命名的表中。

## 常见问题

**Q: `task_for_pid failed` 怎么办？**
确保：(1) 用 `sudo` 运行；(2) 微信已重签（见第一步）；(3) 微信正在运行。

**Q: 微信更新后还能用吗？**
微信更新会恢复原始签名，重新执行第一步（重签）即可。

**Q: 导出的消息中为什么有 `[压缩内容]`？**
微信 WCDB 对部分消息内容使用了 zstd 压缩（`WCDB_CT_message_content=4`），需要额外解压。大部分文本消息不受影响。

**Q: 图片/视频/语音怎么导出？**
本工具目前导出文本记录。图片等媒体文件存储在微信的文件目录中（`xwechat_files/.../Message/`），需要通过 `message_resource.db` 关联路径提取。

**Q: 支持群聊吗？**
支持。群聊的表名是 `Msg_<md5(chatroom_id)>`，导出方式相同。群聊中会显示每个发言者的实际昵称/备注。

## 致谢

- [ydotdog/wechat-export-macos](https://github.com/ydotdog/wechat-export-macos) — 基于此项目开发
- [L1en2407/wechat-decrypt](https://github.com/L1en2407/wechat-decrypt) — C 语言内存扫描器
- [Thearas/wechat-db-decrypt-macos](https://github.com/Thearas/wechat-db-decrypt-macos) — macOS lldb 密钥提取方案
- [ylytdeng/wechat-decrypt](https://github.com/ylytdeng/wechat-decrypt) — 原始内存搜索方案

## License

WTFPL - Do What The Fuck You Want To Public License.
