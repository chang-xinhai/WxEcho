# WxEcho

> ⚠️ **DISCLAIMER**: This tool is intended for personal backup and educational purposes only. Using it may violate the Terms of Service of the messaging platform in question. The author is not responsible for any account suspension, data loss, or legal consequences resulting from the use of this software. Use at your own risk.

macOS native chat history export tool with local database decryption support.

## Overview

WxEcho extracts encryption keys from a running desktop application process, decrypts locally-stored SQLite (SQLCipher 4) databases, and exports chat history into readable TXT / CSV / JSON formats.

Requires **macOS (Apple Silicon & Intel)**.

## Install

```bash
npm install -g wxecho
```

### Manual Install

```bash
git clone https://github.com/chang-xinhai/WxEcho.git
cd WxEcho
npm install
npm run build
```

## How It Works

```
Running App Process ──key extraction──▶ keys.json ──decrypt──▶ plaintext SQLite ──export──▶ TXT/CSV/JSON
   (SQLCipher 4)                          (AES-256-CBC)        (.db files)           (chat history)
```

The desktop app uses [WCDB](https://github.com/nicklockwood/wcdb) (based on SQLCipher 4) with per-database AES-256 keys cached in process memory, stored as `x'<64hex_key><32hex_salt>'`. This tool uses the Mach VM API to scan process memory, match key patterns, verify correctness, then decrypt pages one by one.

## Version Support

| App Version | Status |
|-------------|--------|
| 4.1.5.240   | ✅ Tested |

> Later versions will be added as they are released. Open an Issue if you encounter compatibility problems.

## Quick Start

### Prerequisites

- macOS 11+
- Desktop app 4.x (logged in, chat history synced)
- Xcode Command Line Tools: `xcode-select --install`
- Python 3.8+: `pip install pycryptodome`

### Step 1: Remove Hardened Runtime (allow process memory read)

```bash
# Exit the app first, then run:
sudo codesign --force --deep --sign - /Applications/WeChat.app

# Re-open and log in
```

> **Why is this needed?** The default Hardened Runtime prevents other processes from using `task_for_pid` to read memory. Ad-hoc signing removes this restriction. Re-run after each app update.
>
> **Alternative:** Disable SIP (`csrutil disable`) instead — broader impact though.

### Step 2: Extract Keys

```bash
# Ensure the app is running and logged in
sudo wxecho keys
```

Outputs `all_keys.json` containing decryption keys for all databases.

### Step 3: Decrypt Databases

```bash
wxecho decrypt
```

Decrypted databases are placed in `py/decrypted/`.

### Step 4: Export Chat History

```bash
# List all conversations (by message count)
wxecho export -l

# Export by contact name (fuzzy search by nickname/remark)
wxecho export -n "John Doe"

# Specify output directory
wxecho export -n "John Doe" -o ~/Downloads/my_chat

# Export by exact username
wxecho export -u wxid_xxxxx
```

Exported files:
- `chat.txt` — plain text, human-readable
- `chat.csv` — spreadsheet format (Excel/Numbers compatible)
- `chat.json` — structured JSON, suitable for programmatic analysis

## CLI Commands

| Command | Description |
|---------|-------------|
| `wxecho export [options] [name]` | Export chat history |
| `wxecho decrypt` | Decrypt local databases |
| `wxecho keys` | Extract database keys from running process (requires sudo) |
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

## Database Structure

Decrypted databases in `py/decrypted/`:

```
decrypted/
├── contact/contact.db          # Contacts (nickname, remark, avatar URL, etc.)
├── session/session.db          # Conversation list
├── message/message_0.db        # Chat messages (sharded by time)
├── message/message_1.db
├── message/message_2.db
├── message/message_fts.db     # Full-text search index
├── message/media_0.db         # Voice messages
├── sns/sns.db                  # Moments
├── favorite/favorite.db        # Favorites
├── emoticon/emoticon.db        # Stickers
└── ...
```

Messages for each contact/group are stored in tables named `Msg_<md5(username)>`.

## FAQ

**Q: `task_for_pid failed` — what to do?**
Make sure: (1) running with `sudo`; (2) the app has been re-signed (Step 1); (3) the app is running and logged in.

**Q: Does this work after an app update?**
Updates restore the original code signature. Re-run Step 1 to re-sign.

**Q: Why do some messages show `[Compressed Content]`?**
Some messages use zstd compression (`WCDB_CT_message_content=4`). Most text messages are unaffected.

**Q: How do I export images/videos/audio?**
This tool exports text records only. Media files are stored in the app's file directory (`xwechat_files/.../Message/`). You can correlate paths via `message_resource.db`.

**Q: Are group chats supported?**
Yes. Group chats are stored in tables named `Msg_<md5(chatroom_id)>`. Export works the same way. Each message shows the sender's actual nickname/remark.

## Acknowledgements

- [ydotdog/wechat-export-macos](https://github.com/ydotdog/wechat-export-macos) — original project
- [L1en2407/wechat-decrypt](https://github.com/L1en2407/wechat-decrypt) — C memory scanner
- [Thearas/wechat-db-decrypt-macos](https://github.com/Thearas/wechat-db-decrypt-macos) — lldb key extraction
- [ylytdeng/wechat-decrypt](https://github.com/ylytdeng/wechat-decrypt) — original memory search

## License

MIT License
