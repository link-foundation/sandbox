---
bump: patch
---

Fix PHP Docker image build taking 2+ hours (Issue #44)

Root cause: Homebrew PHP installation falls back to compiling from source when pre-built bottles are unavailable, taking 2+ hours on x86_64.

Solution:
- Install PHP via apt packages in full-sandbox (fast, ~30 seconds)
- Keep Homebrew in standalone PHP image with apt fallback
- Added comprehensive case study in docs/case-studies/issue-44/

Performance improvement:
- Before: 2+ hours (source compilation)
- After: ~30 seconds (apt packages)

The full-sandbox now installs PHP 8.3 from Ubuntu 24.04 repositories which includes php8.3-cli and common extensions.
