#!/bin/bash
# Double-click this file on a Mac to start Innkeep.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Innkeep needs Node.js, which is not installed on this Mac."
  echo "  A page is opening: download the version marked LTS, install it, then double-click this file again."
  echo
  open "https://nodejs.org"
  read -r -p "  Press Return to close this window."
  exit 1
fi
node scripts/start.mjs
echo
read -r -p "  Innkeep has stopped. Press Return to close this window."
