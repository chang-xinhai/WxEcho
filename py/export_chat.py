#!/usr/bin/env python3
"""
WeChat Chat History Exporter

Export chat history with a specific contact or group from decrypted WeChat databases.
Outputs TXT (human-readable), CSV (spreadsheet), and JSON (structured data).

Usage:
    python3 export_chat.py -n "联系人昵称或备注" -o ./output_dir
    python3 export_chat.py -n "Chris"                 # 默认导出到 ~/Downloads/wxecho/Chris/
    python3 export_chat.py -n "工作群"                # 默认导出到 ~/Downloads/wxecho/工作群/
    python3 export_chat.py -l                        # 列出所有会话
    python3 export_chat.py -l --top 30               # 列出前30个会话
"""

import re
import sqlite3
import os
import sys
import json
import csv
import hashlib
import argparse
import subprocess
import shutil
import html
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

from config import load_config

_cfg = load_config()
DECRYPTED_DIR = _cfg["decrypted_dir"]
CONTACT_DB = os.path.join(DECRYPTED_DIR, "contact", "contact.db")

MY_WXID = None  # Auto-detected
MY_NAME = "我"
CST = timezone(timedelta(hours=8))

MSG_TYPES = {
    1: "文本", 3: "图片", 34: "语音", 42: "名片", 43: "视频",
    47: "表情", 48: "位置", 49: "链接/文件/小程序", 50: "语音/视频通话",
    51: "系统消息", 10000: "系统提示", 10002: "撤回消息",
}

MEDIA_TYPES = {3, 34, 43, 47}


def strip_sender_prefix(content):
    """Strip leading sender prefix in group-message payloads."""
    if not isinstance(content, str):
        return content
    return re.sub(r'^(wxid_[a-zA-Z0-9]+|[a-zA-Z][a-zA-Z0-9_-]*@chatroom):\n?', '', content)


def xml_text(elem, path):
    """Get trimmed text from XML path."""
    node = elem.find(path)
    if node is None or node.text is None:
        return ""
    return html.unescape(node.text.strip())


def decode_message_blob(blob):
    """Decode message blob as UTF-8 text, optionally via zstd."""
    if not isinstance(blob, (bytes, bytearray, memoryview)):
        return blob if isinstance(blob, str) else ""

    raw = bytes(blob)
    if not raw:
        return ""

    for encoding in ("utf-8", "utf-16le", "utf-16be"):
        try:
            text = raw.decode(encoding)
            if "\x00" not in text:
                return text
        except UnicodeDecodeError:
            pass

    try:
        import zstandard as zstd

        text = zstd.ZstdDecompressor().decompress(raw).decode("utf-8")
        return text
    except Exception:
        pass

    zstd_bin = shutil.which("zstd")
    if zstd_bin:
        try:
            proc = subprocess.run(
                [zstd_bin, "-d", "-q", "-c"],
                input=raw,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                check=True,
            )
            return proc.stdout.decode("utf-8")
        except Exception:
            pass

    return ""


def parse_app_message(content):
    """Parse WeChat app message XML."""
    if not content or "<appmsg" not in content:
        return None

    try:
        root = ET.fromstring(content)
    except ET.ParseError:
        return None

    appmsg = root.find("appmsg") if root.tag != "appmsg" else root
    if appmsg is None:
        return None

    return {
        "type": xml_text(appmsg, "type"),
        "title": xml_text(appmsg, "title"),
        "des": xml_text(appmsg, "des"),
        "refer_display_name": xml_text(appmsg, "refermsg/displayname"),
        "refer_from_usr": xml_text(appmsg, "refermsg/fromusr"),
        "refer_content": xml_text(appmsg, "refermsg/content"),
    }


def render_plain_text(content):
    """Best-effort rendering of raw message content to readable text."""
    content = strip_sender_prefix(content or "").strip()
    app = parse_app_message(content)
    if not app:
        return html.unescape(content)

    if app["type"] == "57":
        title = app["title"] or "[引用]"
        refer_sender = app["refer_display_name"] or app["refer_from_usr"] or "未知"
        refer_content = render_plain_text(app["refer_content"])
        refer_content = re.sub(r"\s+", " ", refer_content).strip()
        if refer_content:
            return f"{title}\n> {refer_sender}：{refer_content}"
        return title

    if app["title"]:
        return app["title"]
    if app["des"]:
        return app["des"]
    return html.unescape(content)


def normalize_message_content(raw_content):
    """Normalize DB message content into readable plain text."""
    if isinstance(raw_content, str):
        return render_plain_text(raw_content)

    if isinstance(raw_content, (bytes, bytearray, memoryview)):
        decoded = decode_message_blob(raw_content)
        if decoded:
            return render_plain_text(decoded)
        return "[压缩内容未解码]"

    return ""


def get_default_output_dir(name):
    """Get default output directory: ~/Downloads/wxecho/{name}/"""
    return os.path.join(os.path.expanduser("~/Downloads/wxecho"), name)


def get_message_dbs():
    """Find all message database files."""
    msg_dir = os.path.join(DECRYPTED_DIR, "message")
    dbs = []
    if os.path.isdir(msg_dir):
        for f in sorted(os.listdir(msg_dir)):
            if f.startswith("message_") and f.endswith(".db") and "fts" not in f:
                dbs.append(os.path.join(msg_dir, f))
    return dbs


def find_contact(query):
    """Search contacts by nickname, remark, or alias."""
    conn = sqlite3.connect(CONTACT_DB)
    results = conn.execute("""
        SELECT username, nick_name, remark, alias
        FROM contact
        WHERE nick_name LIKE ? OR remark LIKE ? OR alias LIKE ?
    """, (f"%{query}%", f"%{query}%", f"%{query}%")).fetchall()
    conn.close()
    return results


def get_contact_display_name(username):
    """Look up a contact's display name (remark > nick > username) by username/wxid."""
    conn = sqlite3.connect(CONTACT_DB)
    row = conn.execute(
        "SELECT nick_name, remark FROM contact WHERE username = ?",
        (username,)
    ).fetchone()
    conn.close()
    if row:
        nick, remark = row
        return remark if remark else nick
    return username  # Fallback to username if not found


def detect_my_wxid():
    """Auto-detect current user's wxid by finding the most frequent sender across all messages.

    Note: This is a heuristic based on message frequency. If a contact has sent more messages
    than yourself, you may be misidentified as that contact. Use --my-wxid to override if needed.
    """
    sender_count = {}
    name2id_cache = {}  # db_path -> {rowid: wxid}

    for db_path in get_message_dbs():
        conn = sqlite3.connect(db_path)
        try:
            # Build name2id mapping for this DB (skip if table doesn't exist)
            name2id = {}
            try:
                for rowid, uname in conn.execute("SELECT rowid, user_name FROM Name2Id"):
                    name2id[rowid] = uname
            except Exception:
                continue  # Skip DBs without Name2Id table
            name2id_cache[db_path] = name2id

            # Get all tables
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'"
            ).fetchall()

            for (table_name,) in tables:
                try:
                    # Count sender frequency (exclude rowid 0 which seems to be empty/null)
                    rows = conn.execute(f"""
                        SELECT real_sender_id FROM {table_name}
                        WHERE real_sender_id IS NOT NULL AND real_sender_id > 0
                    """).fetchall()

                    for (sender_id,) in rows:
                        wxid = name2id.get(sender_id, "")
                        if wxid and wxid.startswith("wxid_"):
                            sender_count[wxid] = sender_count.get(wxid, 0) + 1
                except Exception:
                    continue
        finally:
            conn.close()

    if not sender_count:
        return None

    # The wxid that appears most frequently as sender is likely the user
    return max(sender_count.items(), key=lambda x: x[1])[0]


def list_conversations(top_n=20):
    """List all conversations with message counts."""
    # Collect all Msg_ tables across databases
    conversations = {}
    for db_path in get_message_dbs():
        conn = sqlite3.connect(db_path)
        try:
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'"
            ).fetchall()
            name2id = {}
            try:
                for rowid, uname in conn.execute("SELECT rowid, user_name FROM Name2Id"):
                    name2id[rowid] = uname
            except Exception:
                pass

            for (table_name,) in tables:
                try:
                    row = conn.execute(f"""
                        SELECT COUNT(*),
                               datetime(MIN(create_time), 'unixepoch', 'localtime'),
                               datetime(MAX(create_time), 'unixepoch', 'localtime')
                        FROM {table_name} WHERE create_time > 0
                    """).fetchone()
                    count, earliest, latest = row
                    if count == 0:
                        continue
                    if table_name not in conversations:
                        conversations[table_name] = {
                            "count": 0, "earliest": earliest, "latest": latest
                        }
                    conversations[table_name]["count"] += count
                    # Update time range
                    if earliest and (not conversations[table_name]["earliest"]
                                    or earliest < conversations[table_name]["earliest"]):
                        conversations[table_name]["earliest"] = earliest
                    if latest and (not conversations[table_name]["latest"]
                                  or latest > conversations[table_name]["latest"]):
                        conversations[table_name]["latest"] = latest
                except Exception:
                    continue
        finally:
            conn.close()

    # Resolve table hashes to contact names
    contact_map = {}
    try:
        conn = sqlite3.connect(CONTACT_DB)
        for username, nick, remark, alias in conn.execute(
            "SELECT username, nick_name, remark, alias FROM contact"
        ):
            h = hashlib.md5(username.encode()).hexdigest()
            table = f"Msg_{h}"
            display = remark if remark else nick
            contact_map[table] = (username, display, nick, remark)
        conn.close()
    except Exception:
        pass

    # Sort by message count
    sorted_convs = sorted(conversations.items(), key=lambda x: x[1]["count"], reverse=True)

    print(f"\n{'排名':<4} {'消息数':<8} {'时间范围':<45} {'显示名':<20} {'用户名'}")
    print("-" * 120)
    for i, (table, info) in enumerate(sorted_convs[:top_n], 1):
        if table in contact_map:
            username, display, nick, remark = contact_map[table]
        else:
            username = table
            display = "(?)"
        time_range = f"{info['earliest']} ~ {info['latest']}"
        print(f"{i:<4} {info['count']:<8} {time_range:<45} {display:<20} {username}")

    print(f"\n共 {len(conversations)} 个会话")


def export_chat(contact_username, contact_display_name, output_dir):
    """Export all messages for a contact."""
    table_hash = hashlib.md5(contact_username.encode()).hexdigest()
    table_name = f"Msg_{table_hash}"

    os.makedirs(output_dir, exist_ok=True)

    global MY_WXID
    if not MY_WXID:
        MY_WXID = detect_my_wxid()

    all_messages = []

    for db_path in get_message_dbs():
        conn = sqlite3.connect(db_path)
        db_name = os.path.basename(db_path)
        try:
            # Per-DB sender lookup
            name2id = {}
            for rowid, uname in conn.execute("SELECT rowid, user_name FROM Name2Id"):
                name2id[rowid] = uname

            rows = conn.execute(f"""
                SELECT local_id, server_id, local_type, create_time,
                       real_sender_id, message_content, source,
                       WCDB_CT_message_content
                FROM {table_name}
                ORDER BY create_time ASC
            """).fetchall()

            for row in rows:
                sender_wxid = name2id.get(row[4], "")
                if sender_wxid == MY_WXID:
                    sender = MY_NAME
                elif row[2] in (10000, 10002):
                    sender = "系统"
                else:
                    sender = get_contact_display_name(sender_wxid)

                content = normalize_message_content(row[5] or "")

                all_messages.append({
                    "time": datetime.fromtimestamp(row[3], tz=CST).strftime(
                        "%Y-%m-%d %H:%M:%S") if row[3] else "",
                    "timestamp": row[3],
                    "sender": sender,
                    "type": row[2],
                    "type_name": MSG_TYPES.get(row[2], f"未知({row[2]})"),
                    "content": content,
                    "server_id": row[1],
                    "db": db_name,
                })

            if rows:
                print(f"  {db_name}: {len(rows)} 条消息")
        except Exception as e:
            pass  # Table doesn't exist in this DB
        finally:
            conn.close()

    all_messages.sort(key=lambda x: x["timestamp"] or 0)

    if not all_messages:
        print(f"未找到与 {contact_display_name} 的聊天记录")
        return

    # === TXT ===
    txt_path = os.path.join(output_dir, "chat.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"微信聊天记录: {contact_display_name} ({contact_username})\n")
        f.write(f"总消息数: {len(all_messages)}\n")
        f.write(f"时间范围: {all_messages[0]['time']} ~ {all_messages[-1]['time']}\n")
        f.write("=" * 60 + "\n\n")

        for m in all_messages:
            content = m["content"]
            if m["type"] in MEDIA_TYPES:
                content = f"[{m['type_name']}]"
            elif m["type"] != 1 and not content:
                content = f"[{m['type_name']}]"
            f.write(f"[{m['time']}] {m['sender']}: {content}\n")

    print(f"  TXT: {txt_path}")

    # === CSV ===
    csv_path = os.path.join(output_dir, "chat.csv")
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["时间", "发送者", "类型", "内容"])
        for m in all_messages:
            content = m["content"]
            if m["type"] in MEDIA_TYPES:
                content = f"[{m['type_name']}]"
            elif m["type"] != 1 and not content:
                content = f"[{m['type_name']}]"
            writer.writerow([m["time"], m["sender"], m["type_name"], content])

    print(f"  CSV: {csv_path}")

    # === JSON ===
    json_path = os.path.join(output_dir, "chat.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_messages, f, ensure_ascii=False, indent=2)

    print(f"  JSON: {json_path}")
    print(f"\n导出完成: {len(all_messages)} 条消息")


def main():
    parser = argparse.ArgumentParser(description="微信聊天记录导出工具")
    parser.add_argument("-n", "--name", help="联系人昵称、备注或微信号（模糊搜索）")
    parser.add_argument("-u", "--username", help="联系人用户名（精确匹配，跳过搜索）")
    parser.add_argument("-o", "--output", help="导出目录（默认: ~/Downloads/wxecho/{name}/）")
    parser.add_argument("--list", "-l", action="store_true", help="列出所有会话")
    parser.add_argument("--top", type=int, default=20, help="列出前N个会话（默认20）")
    parser.add_argument("--my-wxid", help="你自己的微信ID（可选，自动检测）")
    args = parser.parse_args()

    global MY_WXID
    if args.my_wxid:
        MY_WXID = args.my_wxid

    if args.list:
        list_conversations(args.top)
        return

    if not args.name and not args.username:
        parser.print_help()
        return

    if args.username:
        # Direct username, look up display name
        results = find_contact(args.username)
        if results:
            username, nick, remark, alias = results[0]
            display = remark if remark else nick
        else:
            username = args.username
            display = args.username
        output_dir = args.output or get_default_output_dir(display)
        print(f"\n导出: {display} ({username})")
        export_chat(username, display, output_dir)
        return

    # Search by name
    results = find_contact(args.name)

    if not results:
        print(f"未找到匹配 \"{args.name}\" 的联系人")
        return

    if len(results) == 1:
        username, nick, remark, alias = results[0]
        display = remark if remark else nick
        output_dir = args.output or get_default_output_dir(display)
        print(f"\n找到联系人: {display} ({username})")
        export_chat(username, display, output_dir)
    else:
        print(f"\n找到 {len(results)} 个匹配的联系人:")
        for i, (username, nick, remark, alias) in enumerate(results, 1):
            display = remark if remark else nick
            print(f"  {i}. {display} (昵称: {nick}, 备注: {remark}, 微信号: {alias}, ID: {username})")

        try:
            choice = input("\n请选择 [1-{}]: ".format(len(results))).strip()
            if choice.isdigit() and 1 <= int(choice) <= len(results):
                idx = int(choice) - 1
                username, nick, remark, alias = results[idx]
                display = remark if remark else nick
                output_dir = args.output or get_default_output_dir(display)
                print(f"\n导出: {display} ({username})")
                export_chat(username, display, output_dir)
            else:
                print("已取消")
        except (EOFError, KeyboardInterrupt):
            print("\n已取消")


if __name__ == "__main__":
    main()
