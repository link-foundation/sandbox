---
bump: patch
---

Fix sed command error when component names contain forward slashes

The disk space measurement script failed when measuring components with `/` in their names
(e.g., "C/C++ Tools (CMake, Clang, LLVM, LLD)") because sed used `/` as the delimiter.
Changed the sed delimiter from `/` to `|` to avoid conflicts with component names.

Fixes #31
