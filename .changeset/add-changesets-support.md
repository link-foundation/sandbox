---
bump: minor
---

Add changeset-based versioning system for automated releases

This PR introduces a changeset methodology for managing versions and releases:

- Added `.changeset/` directory with configuration and README
- Added release scripts for checking, validating, and applying changesets
- Added version check to prevent manual VERSION file modifications in PRs
- Added changeset check to ensure code changes are documented
- Automatic version bumping on push to main when changesets exist
- Fixed GitHub Actions job skipping issue with `always()` pattern
- Kept support for manual `workflow_dispatch` releases
