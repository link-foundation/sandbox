---
bump: patch
---

Fix CI failure: relative JSON path breaks under `su - sandbox` (Issue #46)

`su - sandbox` (login shell) changes the working directory from the runner's workspace to the sandbox user's home directory. Convert `JSON_OUTPUT_FILE` to an absolute path using `realpath` before passing it to the sandbox user subprocess, and grant the sandbox user read/write access to the JSON file and its parent directory.
