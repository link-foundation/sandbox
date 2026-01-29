---
bump: patch
---

Fix ARM64 Docker build failure by making FASM installation architecture-aware

FASM (Flat Assembler) is only available for x86-64 architecture in Ubuntu repositories.
The installation script now detects the system architecture and only attempts to install
FASM on x86-64 systems, allowing ARM64 builds to complete successfully.
