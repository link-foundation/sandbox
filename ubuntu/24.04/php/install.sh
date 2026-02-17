#!/usr/bin/env bash
# PHP 8.3 installation via Ubuntu packages (fast) with Homebrew fallback
# Usage: curl -fsSL <url> | bash  OR  bash install.sh
#
# This script prioritizes apt packages for speed (completes in ~30 seconds)
# Falls back to Homebrew only if apt installation fails
#
# Issue #44: Homebrew PHP builds can take 2+ hours when bottles unavailable

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
  log_error() { echo "[✗] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
  maybe_sudo() { if [ "$EUID" -eq 0 ]; then "$@"; elif command -v sudo &>/dev/null; then sudo "$@"; else "$@"; fi; }
fi

log_step "Installing PHP 8.3"

# Track installation method
PHP_INSTALL_METHOD=""

# =============================================================================
# Method 1: APT Installation (Preferred - Fast)
# Ubuntu 24.04 includes PHP 8.3 in default repositories
# =============================================================================
install_php_apt() {
  log_info "Attempting fast PHP installation via apt packages..."

  # Update apt sources
  maybe_sudo apt-get update -y || {
    log_warning "apt update failed, trying anyway..."
  }

  # Install PHP 8.3 CLI and common extensions
  # Using timeout to prevent hanging on problematic mirrors
  local apt_packages=(
    php8.3-cli
    php8.3-common
    php8.3-curl
    php8.3-mbstring
    php8.3-xml
    php8.3-zip
    php8.3-bcmath
    php8.3-json
    php8.3-opcache
  )

  if maybe_sudo apt-get install -y "${apt_packages[@]}" 2>/dev/null; then
    PHP_INSTALL_METHOD="apt"

    # Verify installation
    if command_exists php && php --version | grep -q "PHP 8\.3"; then
      log_success "PHP 8.3 installed successfully via apt"

      # Add PHP path configuration to bashrc (for consistency)
      if ! grep -q "# PHP configuration" "$HOME/.bashrc" 2>/dev/null; then
        cat >> "$HOME/.bashrc" << 'PHP_BASHRC_EOF'

# PHP configuration (installed via apt)
alias php-version='php --version'
PHP_BASHRC_EOF
      fi

      return 0
    fi
  fi

  log_warning "apt installation did not complete successfully"
  return 1
}

# =============================================================================
# Method 2: Homebrew Installation (Fallback - Slow if no bottles)
# WARNING: Can take 2+ hours if pre-built bottles are unavailable
# =============================================================================
install_php_homebrew() {
  log_info "Falling back to Homebrew installation..."
  log_warning "This may take 10+ minutes (or 2+ hours if building from source)"

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

        log_info "Installing PHP 8.3 (this may take a while)..."

        # Try with timeout to detect slow builds
        if timeout 600 brew install shivammathur/php/php@8.3 2>&1; then
          PHP_INSTALL_METHOD="homebrew"
        else
          log_error "Homebrew PHP installation timed out or failed"
          log_error "This likely means bottles are unavailable and source compilation is required"
          return 1
        fi

        if brew list --formula 2>/dev/null | grep -q "^php@8.3$"; then
          brew link --overwrite --force shivammathur/php/php@8.3 2>&1 | grep -v "Warning" || true

          BREW_PREFIX=$(brew --prefix 2>/dev/null || echo "")
          if [[ -n "$BREW_PREFIX" && -d "$BREW_PREFIX/opt/php@8.3" ]]; then
            export PATH="$BREW_PREFIX/opt/php@8.3/bin:$BREW_PREFIX/opt/php@8.3/sbin:$PATH"

            if ! grep -q "php@8.3/bin" "$HOME/.bashrc" 2>/dev/null; then
              cat >> "$HOME/.bashrc" << 'PHP_PATH_EOF'

# PHP 8.3 PATH configuration (Homebrew)
export PATH="$(brew --prefix)/opt/php@8.3/bin:$(brew --prefix)/opt/php@8.3/sbin:$PATH"
PHP_PATH_EOF
            fi
          fi

          log_success "PHP installed via Homebrew"
          return 0
        fi
      fi
    else
      log_info "PHP already installed via Homebrew."
      PHP_INSTALL_METHOD="homebrew"
      return 0
    fi
  fi

  return 1
}

# =============================================================================
# Main Installation Logic
# =============================================================================

# Check if PHP is already installed
if command_exists php && php --version 2>/dev/null | grep -q "PHP 8\."; then
  PHP_VERSION=$(php --version 2>/dev/null | head -n 1)
  log_success "PHP already installed: $PHP_VERSION"
  exit 0
fi

# Try apt first (fast), then fallback to Homebrew
if install_php_apt; then
  log_success "PHP installation complete via apt (fast method)"
elif install_php_homebrew; then
  log_success "PHP installation complete via Homebrew (fallback method)"
else
  log_error "PHP installation failed via all methods"
  log_error "Please check logs and try manual installation"
  exit 1
fi

# Final verification
if command_exists php; then
  PHP_VERSION=$(php --version 2>/dev/null | head -n 1 || echo "unknown version")
  log_success "PHP installed and available: $PHP_VERSION"
  log_info "Installation method: $PHP_INSTALL_METHOD"
else
  log_error "PHP not found in PATH after installation"
  exit 1
fi

log_success "PHP installation complete"
