#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
exec node --env-file-if-exists=.env server/index.mjs
