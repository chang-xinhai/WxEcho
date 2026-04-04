<div align="center">

# WxEcho

**macOS Native Chat History Export Tool**

[English](./README_en.md) · [中文](./README_zh.md)

---

<p align="center">
  <img src="https://raw.githubusercontent.com/chang-xinhai/WxEcho/main/landing/public/screenshot.png" alt="WxEcho Screenshot" width="800" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS-11%2B-blue?style=flat-square&logo=apple" />
  <img src="https://img.shields.io/badge/Platform-Apple%20Silicon%20%26%20Intel-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Python-3.8%2B-yellow?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Node.js-npm-orange?style=flat-square&logo=npm" />
</p>

> ⚠️ **DISCLAIMER**: This tool is intended for personal backup and educational purposes only. Using it may violate the Terms of Service of the messaging platform in question. The author is not responsible for any account suspension, data loss, or legal consequences resulting from the use of this software. Use at your own risk.

</div>

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🔑 **Key Extraction** | Extract encryption keys directly from running process memory |
| 🔓 **Database Decryption** | Decrypt SQLCipher 4 (AES-256-CBC) encrypted databases |
| 📤 **Multi-format Export** | Export to TXT / CSV / JSON formats |
| 🔍 **Fuzzy Search** | Search contacts by nickname or remarks |
| 💬 **Group Chat Support** | Full support for group conversations |
| 🍎 **Native macOS** | Built with Mach VM API, runs natively on Apple Silicon & Intel |

</div>

---

## 🚀 Quick Start

### Prerequisites

<div align="center">

- macOS 11+
- Desktop app 4.x (logged in, chat history synced)
- Xcode Command Line Tools: `xcode-select --install`
- Python 3.8+: `pip install pycryptodome`

</div>

### Installation

```bash
npm install -g wxecho
```

Or manually:

```bash
git clone https://github.com/chang-xinhai/WxEcho.git
cd WxEcho
npm install && npm run build
```

### Usage

```bash
# Step 1: Re-sign the app
sudo codesign --force --deep --sign - /Applications/WeChat.app

# Re-open and log in

# Step 2: Extract Keys
sudo wxecho keys

# Step 3: Decrypt Databases
wxecho decrypt

# Step 4: Export Chat History
wxecho export -l                    # List all conversations
wxecho export -n "John Doe"        # Export by name
```

---

## ⚙️ How It Works

<div align="center">

```
Running App Process ──key extraction──▶ keys.json ──decrypt──▶ plaintext SQLite ──export──▶ TXT/CSV/JSON
   (SQLCipher 4)                          (AES-256-CBC)        (.db files)           (chat history)
```

The app uses [WCDB](https://github.com/nicklockwood/wcdb) (based on SQLCipher 4) with per-database AES-256 keys cached in process memory, stored as `x'<64hex_key><32hex_salt>'`.

</div>

---

## 📋 CLI Commands

<div align="center">

| Command | Description |
|---------|-------------|
| `wxecho keys` | Extract database keys from running process (requires sudo) |
| `wxecho decrypt` | Decrypt local databases |
| `wxecho export [options]` | Export chat history |
| `wxecho doctor` | Check environment dependencies |

### export Options

| Option | Description |
|--------|-------------|
| `-l, --list` | List all conversations |
| `-n, --name <name>` | Search contacts by nickname or remark |
| `-u, --username <wxid>` | Match by exact username |
| `-o, --output <dir>` | Specify output directory |
| `--top <n>` | List top N conversations (default: 20) |
| `--my-wxid <wxid>` | Your own user ID (auto-detected if omitted) |

</div>

---

## 📁 Database Structure

<div align="center">

Decrypted databases in `py/decrypted/`:

</div>

```
decrypted/
├── contact/contact.db          # Contacts
├── session/session.db          # Conversation list
├── message/message_0.db        # Chat messages (sharded)
├── message/message_fts.db     # Full-text search
├── message/media_0.db         # Voice messages
├── sns/sns.db                  # Moments
├── favorite/favorite.db        # Favorites
└── ...
```

<div align="center">

Messages for each contact/group are stored in tables named `Msg_<md5(username)>`.

</div>

---

## ❓ FAQ

**Q: `task_for_pid failed` — what to do?**
Make sure: (1) running with `sudo`; (2) the app has been re-signed; (3) the app is running and logged in.

**Q: Does this work after an app update?**
Updates restore the original code signature. Re-run the re-sign step.

**Q: Why do some messages show `[Compressed Content]`?**
Some messages use zstd compression. Most text messages are unaffected.

**Q: How do I export images/videos/audio?**
This tool exports text records only. Media files are in `xwechat_files/.../Message/`, correlate via `message_resource.db`.

**Q: Are group chats supported?**
Yes. Export works the same way. Messages show sender's actual nickname/remark.

---

## 🔗 Related Projects

<div align="center">

| Project | Description |
|---------|-------------|
| [ydotdog/wechat-export-macos](https://github.com/ydotdog/wechat-export-macos) | Reference project |
| [L1en2407/wechat-decrypt](https://github.com/L1en2407/wechat-decrypt) | C memory scanner |
| [Thearas/wechat-db-decrypt-macos](https://github.com/Thearas/wechat-db-decrypt-macos) | lldb key extraction |
| [ylytdeng/wechat-decrypt](https://github.com/ylytdeng/wechat-decrypt) | Original memory search |

</div>

---

## 📜 License

<div align="center">

MIT License

</div>

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/chang-xinhai">chang-xinhai</a>
</p>