---
bump: minor
---

Split sandbox into modular per-language components

Added modular architecture under ubuntu/24.04/ with:
- Per-language install.sh scripts and Dockerfiles (16 languages)
- essentials-sandbox: minimal image for git identity tools
- full-sandbox: complete image built on top of essentials
- Shared common.sh utilities

Each language can now be installed standalone on Ubuntu 24.04 or built
as an independent Docker image, enabling configurable disk usage and
parallel CI/CD builds.
