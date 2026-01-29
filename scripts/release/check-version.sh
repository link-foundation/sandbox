#!/bin/bash
# Check for manual VERSION file modifications in pull requests
# This script prevents manual version changes - versions should only be changed by CI/CD
#
# Environment variables (set by GitHub Actions):
#   - GITHUB_HEAD_REF: Branch name of the PR head
#   - GITHUB_BASE_REF: Branch name of the PR base (defaults to 'main')

echo "Checking for manual version changes in VERSION file..."

# Skip check for automated release PRs
HEAD_REF="${GITHUB_HEAD_REF:-}"
if [[ "$HEAD_REF" == changeset-release/* ]] || [[ "$HEAD_REF" == changeset-manual-release-* ]]; then
  echo "Skipping version check for automated release PR: $HEAD_REF"
  exit 0
fi

BASE_REF="${GITHUB_BASE_REF:-main}"

# Fetch the base branch to ensure we have it
git fetch origin "$BASE_REF" 2>/dev/null || true

# Check if VERSION file was modified in the PR
VERSION_DIFF=$(git diff "origin/${BASE_REF}...HEAD" -- VERSION 2>/dev/null || echo "")

if [ -n "$VERSION_DIFF" ]; then
  echo ""
  echo "::error::Manual VERSION change detected"
  echo ""
  echo "VERSION changes are prohibited in pull requests."
  echo "Versions are managed automatically by the CI/CD pipeline using changesets."
  echo ""
  echo "To request a version bump:"
  echo "  1. Create a changeset file in .changeset/ directory"
  echo "  2. Use format: bump: patch|minor|major followed by description"
  echo "  3. The release workflow will automatically bump VERSION when merged"
  echo ""
  echo "Detected change:"
  echo "$VERSION_DIFF"
  exit 1
fi

echo "No manual version changes detected - check passed"
exit 0
