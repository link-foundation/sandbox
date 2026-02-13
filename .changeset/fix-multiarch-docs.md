---
bump: patch
---

Document all architecture-specific Docker tags in release notes

Fixed release notes template to document all available architecture-specific tags (-amd64, -arm64) for essentials, JS, and language sandboxes. The Docker images were already correctly built and pushed with these tags, but the release notes only mentioned "(multi-arch)".
