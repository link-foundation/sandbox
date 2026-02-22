---
bump: patch
---

Fix PHP ARM64 Docker build timeout (Issue #53)

Root cause: Build hanging after Homebrew bottle download due to known network
instability issues on GitHub Actions ARM64 runners.

Changes:
- Reduce job timeout from 120 to 45 minutes for language builds (fail fast)
- Reduce PHP Homebrew timeout from 30 to 20 minutes
- Add verbose logging with timestamps to identify hang locations
- Add --kill-after flag to timeout command for more reliable termination
- Add timeout to brew link command to catch post-install hangs
- Document issue in case study: docs/case-studies/issue-53/

References:
- GitHub ARM64 runner issues: actions/actions-runner-controller#4365
- Ubuntu network instability: actions/runner-images#11886
