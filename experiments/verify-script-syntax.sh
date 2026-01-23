#!/usr/bin/env bash
# Verify the installation script syntax before building Docker image

set -euo pipefail

echo "==> Verifying installation script syntax..."
echo ""

# Check if the script is valid bash syntax
if bash -n /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Installation script syntax is valid"
else
    echo "✗ Installation script has syntax errors"
    exit 1
fi

# Check for common issues
echo ""
echo "==> Checking for common issues..."

# Check if all new sections are present
if grep -q "Install Assembly Tools" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Assembly tools section found"
else
    echo "✗ Assembly tools section missing"
fi

if grep -q "Install R Language" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ R language section found"
else
    echo "✗ R language section missing"
fi

if grep -q "Ruby (via rbenv)" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Ruby/rbenv section found"
else
    echo "✗ Ruby/rbenv section missing"
fi

if grep -q "Swift ---" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Swift section found"
else
    echo "✗ Swift section missing"
fi

if grep -q "Kotlin (via SDKMAN)" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Kotlin section found"
else
    echo "✗ Kotlin section missing"
fi

# Check verification sections
if grep -q "Assembly Tools:" /tmp/gh-issue-solver-1769108655827/scripts/ubuntu-24-server-install.sh; then
    echo "✓ Assembly verification section found"
else
    echo "✗ Assembly verification section missing"
fi

echo ""
echo "All checks passed!"
