#!/usr/bin/env bash
# Lean theorem prover installation via elan
# Usage: curl -fsSL <url> | bash  OR  bash install.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../common.sh" ]; then
  source "$SCRIPT_DIR/../common.sh"
elif [ -f "/tmp/common.sh" ]; then
  source "/tmp/common.sh"
else
  set -euo pipefail
  log_info() { echo "[*] $1"; }
  log_success() { echo "[✓] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
fi

log_step "Installing Lean via elan"

if [ ! -d "$HOME/.elan" ]; then
  log_info "Installing Lean (via elan)..."
  curl https://elan.lean-lang.org/elan-init.sh -sSf | sh -s -- -y --default-toolchain stable
  if [ -f "$HOME/.elan/env" ]; then
    \. "$HOME/.elan/env"
    log_success "Lean installed successfully"
  fi
  if ! grep -q 'elan' "$HOME/.bashrc" 2>/dev/null; then
    {
      echo ''
      echo '# Lean (elan) configuration'
      echo 'export PATH="$HOME/.elan/bin:$PATH"'
    } >> "$HOME/.bashrc"
  fi
else
  log_info "Lean (elan) already installed."
fi

log_success "Lean installation complete"
