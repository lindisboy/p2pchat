#!/usr/bin/env bash
# handover-to-chatgpt.sh
# Precision timer script to handover p2pchat plan to ChatGPT desktop app at 18:05 IST

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPT_FILE="$REPO_ROOT/docs/planning/handover-prompt.md"
LOG_FILE="$REPO_ROOT/docs/planning/handover.log"

TARGET_TIMESTAMP=1791808500 # 2026-10-12 18:05:00 IST

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Handover daemon initialized. Target: 18:05:00 IST (Epoch: $TARGET_TIMESTAMP)" >> "$LOG_FILE"

CURRENT_TIMESTAMP=$(date +%s)
SLEEP_SECONDS=$(( TARGET_TIMESTAMP - CURRENT_TIMESTAMP ))

if [ "$SLEEP_SECONDS" -gt 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sleeping for $SLEEP_SECONDS seconds until 18:05:00 IST..." >> "$LOG_FILE"
  sleep "$SLEEP_SECONDS"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Triggering handover to ChatGPT desktop app..." >> "$LOG_FILE"

# 1. Copy prompt to clipboard
if command -v wl-copy >/dev/null 2>&1; then
  wl-copy < "$PROMPT_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Copied handover prompt to Wayland clipboard." >> "$LOG_FILE"
fi

# 2. Activate ChatGPT desktop window
if command -v wmctrl >/dev/null 2>&1; then
  wmctrl -x -a ChatGPT 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Activated ChatGPT window via wmctrl." >> "$LOG_FILE"
fi

# 3. Send system desktop notification
if command -v notify-send >/dev/null 2>&1; then
  notify-send -u critical "p2pchat Plan Handover" "ChatGPT rate limits reset! p2pchat master plan and briefing copied to clipboard. ChatGPT window focused. Press Ctrl+V to paste." || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sent desktop notification." >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Handover sequence completed successfully." >> "$LOG_FILE"
