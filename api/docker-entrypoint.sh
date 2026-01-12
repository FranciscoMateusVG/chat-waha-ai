#!/bin/sh
set -e

# Set CI mode for pnpm to avoid TTY prompts
export CI=true

# Ensure dependencies are installed and up-to-date
# This handles the case where named volume has stale node_modules
echo "Syncing dependencies..."
pnpm install --frozen-lockfile

# Execute the main command
exec "$@"
