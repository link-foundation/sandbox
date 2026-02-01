#!/usr/bin/env bash
# PHP 8.3 installation via Homebrew
# Usage: curl -fsSL <url> | bash  OR  bash install.sh
# Requires: Homebrew (will be installed if not present)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../common.sh" ]; then
  source "$SCRIPT_DIR/../common.sh"
elif [ -f "/tmp/common.sh" ]; then
  source "/tmp/common.sh"
else
  set -euo pipefail
  log_info() { echo "[*] $1"; }
  log_success() { echo "[✓] $1"; }
  log_warning() { echo "[!] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
  maybe_sudo() { if [ "$EUID" -eq 0 ]; then "$@"; elif command -v sudo &>/dev/null; then sudo "$@"; else "$@"; fi; }
fi

log_step "Installing PHP 8.3 via Homebrew"

# Ensure Homebrew directory exists
if [ ! -d /home/linuxbrew/.linuxbrew ]; then
  log_info "Creating Homebrew directory..."
  maybe_sudo mkdir -p /home/linuxbrew/.linuxbrew
  maybe_sudo chown -R "$(whoami)":"$(whoami)" /home/linuxbrew 2>/dev/null || true
fi

# Install Homebrew if not present
if ! command_exists brew; then
  log_info "Installing Homebrew..."
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" 2>&1 || true

  if [[ -x /home/linuxbrew/.linuxbrew/bin/brew ]]; then
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
  elif [[ -x "$HOME/.linuxbrew/bin/brew" ]]; then
    eval "$("$HOME/.linuxbrew/bin/brew" shellenv)"
  fi

  if ! grep -q "brew shellenv" "$HOME/.bashrc" 2>/dev/null; then
    BREW_PREFIX=$(brew --prefix 2>/dev/null || echo "/home/linuxbrew/.linuxbrew")
    echo "eval \"\$($BREW_PREFIX/bin/brew shellenv)\"" >> "$HOME/.bashrc"
  fi
else
  eval "$(brew shellenv 2>/dev/null)" || true
fi

# Install PHP via Homebrew
if command_exists brew; then
  if ! brew list --formula 2>/dev/null | grep -q "^php@"; then
    log_info "Installing PHP via Homebrew..."

    if ! brew tap | grep -q "shivammathur/php"; then
      brew tap shivammathur/php || true
    fi

    if brew tap | grep -q "shivammathur/php"; then
      export HOMEBREW_NO_ANALYTICS=1
      export HOMEBREW_NO_AUTO_UPDATE=1

      log_info "Installing PHP 8.3..."
      brew install shivammathur/php/php@8.3 || true

      if brew list --formula 2>/dev/null | grep -q "^php@8.3$"; then
        brew link --overwrite --force shivammathur/php/php@8.3 2>&1 | grep -v "Warning" || true

        BREW_PREFIX=$(brew --prefix 2>/dev/null || echo "")
        if [[ -n "$BREW_PREFIX" && -d "$BREW_PREFIX/opt/php@8.3" ]]; then
          export PATH="$BREW_PREFIX/opt/php@8.3/bin:$BREW_PREFIX/opt/php@8.3/sbin:$PATH"

          if ! grep -q "php@8.3/bin" "$HOME/.bashrc" 2>/dev/null; then
            cat >> "$HOME/.bashrc" << 'PHP_PATH_EOF'

# PHP 8.3 PATH configuration
export PATH="$(brew --prefix)/opt/php@8.3/bin:$(brew --prefix)/opt/php@8.3/sbin:$PATH"
PHP_PATH_EOF
          fi
        fi

        if command -v php &>/dev/null; then
          PHP_VERSION=$(php --version 2>/dev/null | head -n 1 || echo "unknown version")
          log_success "PHP installed and available: $PHP_VERSION"
        fi
      fi
    fi
  else
    log_info "PHP already installed via Homebrew."
  fi
fi

log_success "PHP installation complete"
