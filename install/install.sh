#!/usr/bin/env sh
# Installs RachnaSutra skills into the current project. Usage: ./install.sh <host> [--dry-run]
set -eu
host="${1:?usage: install.sh <claude|cursor|codex|copilot|gemini> [--dry-run]}"
shift || true
exec npx --yes github:shahvatsalofficial/rachnasutra skills install --host "$host" --target . "$@"
