---
bump: patch
---

Fix CI failure: sandbox-measure.sh sed-based JSON append fails silently (Issue #49)

The sandbox-measure.sh heredoc used sed to append component measurements to the JSON
output file. The pattern `s|\]$|,...|` does not match compact (single-line) JSON
produced by python3's json.dump(), which ends with `}` (root object close) not `]`
(array close). As a result, all 18 sandbox user components were silently discarded
while still printing `[✓] Recorded` to stdout. Validation then found only 9 components
(below the threshold of 10), causing the CI run to fail.

Fix: replace the sed-based add_measurement() in the sandbox-measure.sh heredoc with
the same python3-based implementation already used by the outer script (fixed in
issue-35). Python's json module handles compact JSON and special characters correctly.
