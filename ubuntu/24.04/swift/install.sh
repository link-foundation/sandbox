#!/usr/bin/env bash
# Swift installation
# Usage: curl -fsSL <url> | bash  OR  bash install.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../common.sh" ]; then
  source "$SCRIPT_DIR/../common.sh"
else
  set -euo pipefail
  log_info() { echo "[*] $1"; }
  log_success() { echo "[✓] $1"; }
  log_warning() { echo "[!] $1"; }
  log_error() { echo "[✗] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
fi

log_step "Installing Swift"

if ! command_exists swift; then
  log_info "Installing Swift..."

  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64)
      SWIFT_DIR="ubuntu2404"
      SWIFT_FILE_SUFFIX="ubuntu24.04"
      ;;
    aarch64)
      SWIFT_DIR="ubuntu2404-aarch64"
      SWIFT_FILE_SUFFIX="ubuntu24.04-aarch64"
      ;;
    *)
      SWIFT_DIR=""
      SWIFT_FILE_SUFFIX=""
      ;;
  esac

  if [ -n "$SWIFT_DIR" ]; then
    SWIFT_VERSION="6.0.3"
    SWIFT_RELEASE="RELEASE"
    SWIFT_PACKAGE="swift-${SWIFT_VERSION}-${SWIFT_RELEASE}-${SWIFT_FILE_SUFFIX}"
    SWIFT_URL="https://download.swift.org/swift-${SWIFT_VERSION}-release/${SWIFT_DIR}/swift-${SWIFT_VERSION}-${SWIFT_RELEASE}/${SWIFT_PACKAGE}.tar.gz"

    log_info "Downloading Swift $SWIFT_VERSION for $ARCH..."
    TEMP_DIR=$(mktemp -d)

    if curl -fsSL "$SWIFT_URL" -o "$TEMP_DIR/swift.tar.gz"; then
      log_info "Installing Swift to $HOME/.swift..."
      mkdir -p "$HOME/.swift"
      tar -xzf "$TEMP_DIR/swift.tar.gz" -C "$TEMP_DIR"
      cp -r "$TEMP_DIR/${SWIFT_PACKAGE}/usr" "$HOME/.swift/"
      rm -rf "$TEMP_DIR"

      if ! grep -q 'swift' "$HOME/.bashrc" 2>/dev/null; then
        {
          echo ''
          echo '# Swift configuration'
          echo 'export PATH="$HOME/.swift/usr/bin:$PATH"'
        } >> "$HOME/.bashrc"
      fi

      export PATH="$HOME/.swift/usr/bin:$PATH"

      if command -v swift &>/dev/null; then
        log_success "Swift installed: $(swift --version | head -n1)"
      fi
    else
      log_error "Failed to download Swift from $SWIFT_URL"
      rm -rf "$TEMP_DIR"
    fi
  else
    log_warning "Swift installation skipped: unsupported architecture $ARCH"
  fi
else
  log_info "Swift already installed."
fi

log_success "Swift installation complete"
