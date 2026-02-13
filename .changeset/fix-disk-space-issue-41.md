---
bump: patch
---

Fix "No space left on device" error in Docker image publishing workflow

Added disk space cleanup step using jlumbroso/free-disk-space action to the docker-build-push
and docker-build-push-arm64 jobs. This frees approximately 30 GB of disk space by removing
unused pre-installed software (Android SDK, .NET runtime, large packages) before building
the full sandbox Docker images.

This fix addresses issue #41 where the workflow failed due to disk space exhaustion.
Full case study analysis available in docs/case-studies/issue-41/CASE-STUDY.md.
