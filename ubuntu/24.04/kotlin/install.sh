#!/usr/bin/env bash
# Kotlin installation via SDKMAN
# Usage: curl -fsSL <url> | bash  OR  bash install.sh
# Kotlin requires a JVM at runtime (kotlinc is a shell wrapper around `java`),
# so this script also installs Java 21 LTS via SDKMAN if it is not already
# present. The standalone box-kotlin image must be runnable on its own.

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
fi

log_step "Installing Kotlin via SDKMAN"

# Ensure SDKMAN is installed
if [ ! -d "$HOME/.sdkman" ]; then
  log_info "SDKMAN not found, installing..."
  curl -s "https://get.sdkman.io?rcupdate=false&ci=true" | bash
  if ! grep -q 'sdkman-init.sh' "$HOME/.bashrc" 2>/dev/null; then
    {
      echo ''
      echo '# SDKMAN configuration'
      echo 'export SDKMAN_DIR="$HOME/.sdkman"'
      echo '[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ] && . "$HOME/.sdkman/bin/sdkman-init.sh"'
    } >> "$HOME/.bashrc"
  fi
fi

export SDKMAN_DIR="$HOME/.sdkman"
if [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ]; then
  set +u
  source "$SDKMAN_DIR/bin/sdkman-init.sh"
  set -u

  # Kotlin runtime needs Java; install it first if missing.
  if ! command_exists java; then
    log_info "Installing Java 21 LTS (Temurin) via SDKMAN (required by Kotlin)..."
    set +u
    sdk install java 21-tem < /dev/null || {
      log_warning "Eclipse Temurin installation failed, trying default OpenJDK..."
      sdk install java 21-open < /dev/null || true
    }
    set -u

    if command -v java &>/dev/null; then
      log_success "Java installed: $(java -version 2>&1 | head -n1)"
    else
      log_warning "Java installation did not produce a usable java binary."
    fi
  else
    log_info "Java already installed."
  fi

  if ! command_exists kotlin; then
    log_info "Installing Kotlin via SDKMAN..."
    set +u
    sdk install kotlin < /dev/null || true
    set -u

    if command -v kotlin &>/dev/null; then
      log_success "Kotlin installed: $(kotlin -version 2>&1 | head -n1)"
    fi
  else
    log_info "Kotlin already installed."
  fi
fi

log_success "Kotlin installation complete"
