# Changesets

This folder is used to track version changes using the changeset methodology.

## How to add a changeset

When you make changes that should trigger a version bump, create a new markdown file in this directory with the following format:

```markdown
---
bump: patch
---

Description of what changed
```

The `bump` field can be:
- `patch` - Bug fixes, minor updates (1.0.0 -> 1.0.1)
- `minor` - New features, backwards compatible (1.0.0 -> 1.1.0)
- `major` - Breaking changes (1.0.0 -> 2.0.0)

## How it works

1. Contributors add changeset files in their PRs
2. When merged to main, the CI workflow detects changesets
3. CI automatically bumps the VERSION file and creates a release
4. The changeset files are deleted after the version is applied

## File naming

Use descriptive names for changeset files, e.g.:
- `add-python-support.md`
- `fix-entrypoint-script.md`
- `update-nodejs-version.md`

Or use random names like: `happy-dogs-jump.md`
