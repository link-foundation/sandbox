#!/usr/bin/env bash
set -euo pipefail

# Essentials Sandbox Installation Script
# Installs minimal tooling required for gh-setup-git-identity and glab-setup-git-identity
# Components: system essentials, GitHub CLI, GitLab CLI, JavaScript (Bun, NVM/Node, Deno)
#
# This is the base image that full-sandbox builds upon.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../common.sh" ]; then
  source "$SCRIPT_DIR/../common.sh"
else
  # Inline fallback logging
  log_info() { echo "[*] $1"; }
  log_success() { echo "[✓] $1"; }
  log_warning() { echo "[!] $1"; }
  log_error() { echo "[✗] $1"; }
  log_note() { echo "[i] $1"; }
  log_step() { echo "==> $1"; }
  command_exists() { command -v "$1" &>/dev/null; }
  maybe_sudo() { if [ "$EUID" -eq 0 ]; then "$@"; elif command -v sudo &>/dev/null; then sudo "$@"; else "$@"; fi; }
fi

log_step "Installing Essentials Sandbox"

# --- Pre-flight Checks ---
log_step "Running pre-flight checks"

if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
  log_error "This script requires sudo access."
  exit 1
fi

if [ -f /etc/os-release ]; then
  source /etc/os-release
  if [[ "${ID:-}" == "ubuntu" ]]; then
    log_success "Ubuntu ${VERSION_ID:-unknown} detected"
  else
    log_warning "This script is designed for Ubuntu. Detected: ${ID:-unknown}"
  fi
fi

log_success "Pre-flight checks passed"

# --- Create sandbox user ---
log_step "Setting up sandbox user"
if id "sandbox" &>/dev/null; then
  log_info "sandbox user already exists."
else
  log_info "Creating sandbox user..."
  useradd -m -s /bin/bash sandbox 2>/dev/null || adduser --disabled-password --gecos "" sandbox
  passwd -d sandbox 2>/dev/null || true
  usermod -aG sudo sandbox 2>/dev/null || true
  log_success "sandbox user created"
fi

# --- System prerequisites ---
log_step "Installing system prerequisites"

# Clean up duplicate sources
for pair in "microsoft-edge:microsoft-edge-stable" "google-chrome:google-chrome-stable"; do
  f1="/etc/apt/sources.list.d/${pair%%:*}.list"
  f2="/etc/apt/sources.list.d/${pair##*:}.list"
  if [ -f "$f1" ] && [ -f "$f2" ]; then
    maybe_sudo rm -f "$f1"
  fi
done

maybe_sudo apt update -y || true
maybe_sudo apt install -y wget curl unzip zip git sudo ca-certificates gnupg build-essential expect screen
log_success "System prerequisites installed"

# --- GitHub CLI ---
log_step "Installing GitHub CLI"
if ! command_exists gh; then
  maybe_sudo mkdir -p -m 755 /etc/apt/keyrings
  out=$(mktemp)
  wget -nv -O"$out" https://cli.github.com/packages/githubcli-archive-keyring.gpg
  cat "$out" | maybe_sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
  maybe_sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  rm -f "$out"

  maybe_sudo mkdir -p -m 755 /etc/apt/sources.list.d
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | maybe_sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

  maybe_sudo apt update -y
  maybe_sudo apt install -y gh
  log_success "GitHub CLI installed"
else
  log_success "GitHub CLI already installed"
fi

# --- GitLab CLI ---
log_step "Installing GitLab CLI"
if ! command_exists glab; then
  maybe_sudo apt install -y glab
  log_success "GitLab CLI installed"
else
  log_success "GitLab CLI already installed"
fi

# --- JavaScript runtimes (as sandbox user) ---
log_step "Installing JavaScript runtimes"

cat > /tmp/essentials-js-setup.sh <<'EOF_JS'
#!/usr/bin/env bash
set -euo pipefail

log_info() { echo "[*] $1"; }
log_success() { echo "[✓] $1"; }
command_exists() { command -v "$1" &>/dev/null; }

# Bun
if ! command_exists bun; then
  log_info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
fi
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# gh-setup-git-identity
if command_exists bun; then
  if ! command_exists gh-setup-git-identity; then
    log_info "Installing gh-setup-git-identity..."
    bun install -g gh-setup-git-identity
  fi
fi

# glab-setup-git-identity
if command_exists bun; then
  if ! command_exists glab-setup-git-identity; then
    log_info "Installing glab-setup-git-identity..."
    bun install -g glab-setup-git-identity
  fi
fi

# Deno
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
fi

# NVM + Node.js
if [ ! -d "$HOME/.nvm" ]; then
  log_info "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! nvm ls 20 2>/dev/null | grep -q 'v20'; then
  log_info "Installing Node.js 20..."
  nvm install 20
fi
nvm use 20

log_info "Updating npm..."
npm install -g npm@latest --no-fund --silent

# Git setup
if gh auth status &>/dev/null; then
  log_info "Configuring Git with GitHub identity..."
  git config --global user.name "$(gh api user --jq .login)"
  git config --global user.email "$(gh api user/emails --jq '.[] | select(.primary==true).email')"
  gh auth setup-git
fi

log_success "Essentials sandbox user setup complete"
EOF_JS

chmod +x /tmp/essentials-js-setup.sh
if [ "$EUID" -eq 0 ]; then
  su - sandbox -c "bash /tmp/essentials-js-setup.sh"
else
  sudo -i -u sandbox bash /tmp/essentials-js-setup.sh
fi
rm -f /tmp/essentials-js-setup.sh

# --- Cleanup ---
log_step "Cleaning up"
maybe_sudo apt-get clean
maybe_sudo apt-get autoclean
maybe_sudo apt-get autoremove -y
maybe_sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

log_step "Essentials Sandbox setup complete!"
log_success "Installed: git, gh, glab, bun, deno, nvm/node, gh-setup-git-identity, glab-setup-git-identity"
