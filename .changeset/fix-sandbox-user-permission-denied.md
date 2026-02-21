---
bump: patch
---

Fix CI failure: Permission denied when sandbox user reads JSON file (Issue #46)

The realpath fix from v1.3.5 resolved the "No such file or directory" error but not the
"Permission denied" error. The GitHub Actions workspace root (/home/runner/work/sandbox/sandbox/)
has mode 750 (owned by runner), blocking the sandbox user from traversing into it.

Fix: copy the JSON measurements file to /tmp (world-accessible, mode 1777) before running
the sandbox user subprocess, then copy the result back. This avoids any need for the sandbox
user to traverse runner-owned directories.
