#!/usr/bin/env bash
# JavaScript/TypeScript runtime installation (Node.js via NVM, Bun, Deno)
# Usage: curl -fsSL <url> | bash  OR  bash install.sh
# Requires: curl, git (should be pre-installed on Ubuntu 24.04)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../common.sh" ]; then
  source "$SCRIPT_DIR/../common.sh"
else
  set -euo pipefail
  log_info() { echo "[*] $1"; }
  log_success() { echo "[✓] $1"; }
  log_warning() { echo "[!] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
fi

log_step "Installing JavaScript/TypeScript runtimes"

# --- Bun ---
if ! command_exists bun; then
  log_info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  log_success "Bun installed"
else
  log_info "Bun already installed."
fi

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# --- Deno ---
if ! command_exists deno; then
  log_info "Installing Deno..."
  curl -fsSL https://deno.land/install.sh | sh -s -- -y
  export DENO_INSTALL="$HOME/.deno"
  export PATH="$DENO_INSTALL/bin:$PATH"
  if ! grep -q 'DENO_INSTALL' "$HOME/.bashrc" 2>/dev/null; then
    {
      echo ''
      echo '# Deno configuration'
      echo 'export DENO_INSTALL="$HOME/.deno"'
      echo 'export PATH="$DENO_INSTALL/bin:$PATH"'
    } >> "$HOME/.bashrc"
  fi
  log_success "Deno installed"
else
  log_info "Deno already installed."
fi

# --- NVM + Node.js ---
if [ ! -d "$HOME/.nvm" ]; then
  log_info "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  log_success "NVM installed"
else
  log_info "NVM already installed."
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

if ! nvm ls 20 2>/dev/null | grep -q 'v20'; then
  log_info "Installing Node.js 20..."
  nvm install 20
  log_success "Node.js 20 installed"
else
  log_info "Node.js 20 already installed"
fi
nvm use 20

log_info "Updating npm to latest version..."
npm install -g npm@latest --no-fund --silent
log_success "npm updated to latest version"

# --- gh-setup-git-identity ---
if command_exists bun; then
  if ! command_exists gh-setup-git-identity; then
    log_info "Installing gh-setup-git-identity..."
    bun install -g gh-setup-git-identity
    log_success "gh-setup-git-identity installed"
  else
    log_info "gh-setup-git-identity already installed."
  fi
fi

# --- glab-setup-git-identity ---
if command_exists bun; then
  if ! command_exists glab-setup-git-identity; then
    log_info "Installing glab-setup-git-identity..."
    bun install -g glab-setup-git-identity
    log_success "glab-setup-git-identity installed"
  else
    log_info "glab-setup-git-identity already installed."
  fi
fi

log_success "JavaScript/TypeScript runtimes installation complete"
