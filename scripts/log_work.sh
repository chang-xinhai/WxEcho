#!/usr/bin/env bash
set -euo pipefail

# WxEcho Agent Worklog Script
# 用法: log_work.sh [--actor A] [--status S] [--summary T] [--paths P] [--commands C] [--artifacts A] [--blockers B] [--next N]

WORKLOG="${WORKLOG_PATH:-$HOME/agents/handoffs/WORKLOG.md}"
ACTOR="${WORKLOG_ACTOR:-${USER:-unknown}}"
STATUS=""
SUMMARY=""
PATHS=""
COMMANDS=""
ARTIFACTS=""
BLOCKERS=""
NEXT_STEP=""

usage() {
  printf 'Usage: log_work.sh [options]\n'
  printf 'Options:\n'
  printf '  --actor    <name>    Actor name (default: %%USER%%)\n'
  printf '  --status   <status> Status: planned|in_progress|blocked|done|cancelled\n'
  printf '  --summary  <text>   One-line summary (required)\n'
  printf '  --paths    <paths>  Repo paths involved\n'
  printf '  --commands <cmds>   Commands executed\n'
  printf '  --artifacts <files> Artifact paths\n'
  printf '  --blockers <text>   Blockers\n'
  printf '  --next     <text>   Next step\n'
  printf '  -h|--help           Show this help\n'
}

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
    -h|--help)  usage; exit 0 ;;
    *)          printf 'Unknown arg: %s\n' "$1" >&2; exit 1 ;;
  esac
done

case "$STATUS" in
  planned|in_progress|blocked|done|cancelled) ;;
  *) printf 'Invalid --status: %s\n' "$STATUS" >&2; exit 1 ;;
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
