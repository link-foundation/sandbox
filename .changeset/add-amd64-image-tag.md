---
bump: patch
---

Add AMD64-specific Docker image tags to release workflow

The release workflow now publishes architecture-specific `-amd64` tags
(e.g., `1.2.1-amd64`, `latest-amd64`) alongside the existing `-arm64` tags,
providing symmetry between architectures. The multi-arch manifest now
explicitly references the `-amd64` and `-arm64` tagged images. Release notes
are updated to list the AMD64 tag.
