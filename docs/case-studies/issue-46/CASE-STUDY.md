# Case Study: Failing CI/CD Run — "No such file or directory" for JSON Measurements

**Issue**: [#46 - Fix failing CI/CD run](https://github.com/link-foundation/sandbox/issues/46)
**CI Run**: [22261112919, Job 64399507098](https://github.com/link-foundation/sandbox/actions/runs/22261112919/job/64399507098)
**Date**: 2026-02-21
**Status**: Investigation Complete — Fix Applied

## Executive Summary

The "Measure Disk Space and Update README" workflow failed with:

```
cat: data/disk-space-measurements.json: No such file or directory
##[error]Process completed with exit code 1.
```

The root cause is that `su - sandbox` (login shell) changes the working directory to the sandbox user's home (`/home/sandbox`). The relative path `data/disk-space-measurements.json` then resolves to `/home/sandbox/data/disk-space-measurements.json` — a file that was never created there. The JSON file was correctly initialized in the runner's working directory (`/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json`), but the sandbox-measure.sh script tried to read and write a different file.

**Fix**: Convert the relative JSON output path to an absolute path before passing it to `su - sandbox`.

## Timeline of Events

| Time (UTC) | Event |
|------------|-------|
| 2026-02-21T17:29:57 | Job started on ubuntu-24.04 runner (version 20260201.15.1) |
| 2026-02-21T17:31:25 | `measure-disk-space.sh` invoked: `sudo ./scripts/measure-disk-space.sh --json-output data/disk-space-measurements.json` |
| 2026-02-21T17:31:26 | JSON initialized at `data/disk-space-measurements.json` (relative to runner CWD: `/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json`) |
| 2026-02-21T17:31:26 | Measurements begin for system components (Essential Tools, .NET, C/C++, etc.) |
| 2026-02-21T17:32:57 | GitLab CLI recorded as last successful system measurement |
| 2026-02-21T17:32:57 | `su - sandbox -c "bash /tmp/sandbox-measure.sh 'data/disk-space-measurements.json'"` executed |
| 2026-02-21T17:32:57 | Login shell changes CWD to `/home/sandbox`; relative path resolves to wrong location |
| 2026-02-21T17:32:58 | Bun installs successfully to `/home/sandbox/.bun/bin/bun` |
| 2026-02-21T17:32:58 | `add_measurement "Bun"` calls `cat data/disk-space-measurements.json` — **file not found** |
| 2026-02-21T17:32:58 | Script exits with code 1; `set -euo pipefail` propagates failure |
| 2026-02-21T17:32:58 | Workflow step fails: `cat: data/disk-space-measurements.json: No such file or directory` |

## Root Cause Analysis

### Primary Cause: `su -` (Login Shell) Changes Working Directory

The `su -` command (equivalent to `su --login` or `su -l`) simulates a full login for the target user. According to the [Linux `su` man page](https://manpages.ubuntu.com/manpages/focal/en/man1/su.1.html) and [Linuxize's su documentation](https://linuxize.com/post/su-command-in-linux/):

> When using `su -`, the command **changes the current working directory to the home directory of the target user**. All environment variables are reset to the target user's environment.

The relevant code in `measure-disk-space.sh` (line 646):

```bash
su - sandbox -c "bash /tmp/sandbox-measure.sh '$JSON_OUTPUT_FILE'"
```

Where `JSON_OUTPUT_FILE` is `data/disk-space-measurements.json` (a relative path).

**Before `su - sandbox`**: Working directory = `/home/runner/work/sandbox/sandbox`
- Relative path resolves to: `/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json` ✓ (file exists)

**After `su - sandbox`**: Working directory = `/home/sandbox`
- Relative path resolves to: `/home/sandbox/data/disk-space-measurements.json` ✗ (file does not exist)

The sandbox-measure.sh script's `add_measurement` function then fails at:

```bash
current_json=$(cat "$JSON_OUTPUT_FILE")  # Fails: No such file or directory
```

This error propagates through `set -euo pipefail`, causing the sandbox-measure.sh to exit with code 1, which then causes the outer script and the workflow step to fail.

### Why Bun Appears in the Error

The failure appears immediately after Bun installation because Bun is the **first measurement** in sandbox-measure.sh. The successful Bun installation output (`bun was installed successfully to ~/.bun/bin/bun`) appears before the JSON read failure because:

1. `measure_install "Bun" "Runtime" install_bun` — calls `install_bun` which succeeds
2. `add_measurement "Bun" ...` — calls `cat "$JSON_OUTPUT_FILE"` which fails

Bun itself is **not the cause** of the failure. The error would have occurred even if Bun installation was skipped, as the JSON file issue affects all measurements.

### Why the JSON File Was "Missing"

The JSON file was never truly missing — it was created correctly at:
```
/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json
```

But the sandbox user's script looked for it at:
```
/home/sandbox/data/disk-space-measurements.json
```

This directory (`/home/sandbox/data/`) was never created, making the path completely inaccessible to the sandbox user. Additionally, even if the directory existed, the sandbox user would not normally have write access to the runner's working directory structure.

### Contributing Factors

1. **`set -euo pipefail` in outer script**: `set -euo pipefail` at the top of `measure-disk-space.sh` (line 2) ensures any failure in the subprocess chain propagates correctly — this is correct behavior, but amplifies the visibility of the root cause bug.

2. **`su -` vs `su`**: The login shell option (`-`) was chosen deliberately to give the sandbox user a clean environment for installation. This is the correct approach for user-space installations, but requires careful handling of paths. According to [Baeldung's analysis](https://www.baeldung.com/linux/su-command-options), `su -` "simulates a full login" and "resets environment variables and changes to the user's home directory."

3. **Relative path throughout**: The JSON output file is passed as a relative path from the CLI argument `--json-output data/disk-space-measurements.json`. This relative path is never converted to an absolute path, so it becomes invalid after a working directory change.

## Solution

### Fix: Convert to Absolute Path Before `su - sandbox`

The fix is to resolve the JSON output path to an absolute path before executing the sandbox user's sub-script. This ensures the path remains valid regardless of what working directory the sub-shell starts in.

```bash
# Convert JSON_OUTPUT_FILE to absolute path before passing to su
JSON_OUTPUT_FILE_ABS="$(realpath "$JSON_OUTPUT_FILE")"

if [ "$EUID" -eq 0 ]; then
  su - sandbox -c "bash /tmp/sandbox-measure.sh '$JSON_OUTPUT_FILE_ABS'"
else
  sudo -i -u sandbox bash /tmp/sandbox-measure.sh "$JSON_OUTPUT_FILE_ABS"
fi
```

Additionally, the `sandbox-measure.sh` script needs to create the parent directory if it doesn't exist, since the sandbox user may not have the `data/` directory in their home:

```bash
# At the start of sandbox-measure.sh
mkdir -p "$(dirname "$JSON_OUTPUT_FILE")"
```

### Why This Fix Is Correct

- `realpath` converts relative paths to absolute paths using the current working directory
- The absolute path `/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json` is unambiguous and valid from any working directory
- The sandbox user needs write access to this path — since the runner runs with elevated privileges and the outer script (running as root) creates the file, the sandbox user needs read/write access, which can be ensured by pre-creating the file with appropriate permissions

### Alternative Approaches Considered

1. **Use `su` without `-`** (no login shell): Would preserve the working directory but break user-space tool installations that expect a clean home environment. Not recommended.

2. **Pass absolute path directly from CLI**: Requires users to always specify absolute paths in the workflow, which is error-prone.

3. **Use `cd` inside `su -` command**: Adding `cd /path/to/workdir &&` before the script call would work but is fragile.

4. **Write JSON to `/tmp/` instead of `data/`**: Would avoid the working directory issue but changes the documented output location.

## Technical Details

### Environment Comparison

| Context | Working Directory | `data/disk-space-measurements.json` resolves to |
|---------|------------------|--------------------------------------------------|
| Runner shell | `/home/runner/work/sandbox/sandbox` | `/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json` ✓ |
| Root (outer script) | `/home/runner/work/sandbox/sandbox` | `/home/runner/work/sandbox/sandbox/data/disk-space-measurements.json` ✓ |
| `su - sandbox` | `/home/sandbox` | `/home/sandbox/data/disk-space-measurements.json` ✗ |

### Affected Script Section

**File**: `scripts/measure-disk-space.sh`, lines 644–649

```bash
# Execute sandbox user measurements
if [ "$EUID" -eq 0 ]; then
  su - sandbox -c "bash /tmp/sandbox-measure.sh '$JSON_OUTPUT_FILE'"
else
  sudo -i -u sandbox bash /tmp/sandbox-measure.sh "$JSON_OUTPUT_FILE"
fi
```

The `sudo -i -u sandbox` also creates a login shell (`-i` flag = simulate initial login), so the same path issue would affect that branch too.

### Bun Installation Script Behavior

For reference, Bun's install script (`https://bun.sh/install`) uses `set -euo pipefail` and adds `~/.bun/bin` to `$HOME/.bash_profile`. The script exits 0 on success and 1 on failure. In this CI run, Bun installed successfully (exit 0), confirming that Bun itself is not the failure source.

## CI Run Data

- **Workflow**: "Measure Disk Space and Update README"
- **Job**: "Measure Component Disk Space"
- **Run ID**: 22261112919
- **Job ID**: 64399507098
- **Runner**: ubuntu-24.04, version 20260201.15.1
- **Commit**: 38673b0f4aa8c91069a9473a5df1d157c8522584 (main)
- **Trigger**: Push to main branch

### Components Successfully Recorded Before Failure

| Component | Category | Size |
|-----------|----------|------|
| Essential Tools | System | 0MB |
| .NET SDK 8.0 | Runtime | 481MB |
| C/C++ Tools (CMake, Clang, LLVM, LLD) | Build Tools | 56MB |
| Assembly Tools (NASM, FASM) | Build Tools | 3MB |
| R Language | Runtime | 115MB |
| Ruby Build Dependencies | Dependencies | 0MB |
| Python Build Dependencies | Dependencies | 40MB |
| GitHub CLI | Development Tools | 0MB |
| GitLab CLI | Development Tools | 27MB |

### Components Not Recorded (Sandbox User Installations)

All sandbox user installations failed due to the JSON path issue:
- Bun, gh-setup-git-identity, glab-setup-git-identity, Deno, NVM + Node.js 20
- Pyenv + Python, Go, Rust, SDKMAN + Java 21, Kotlin, Lean, Opam + Rocq
- Homebrew, PHP 8.3, Perlbrew + Perl, rbenv + Ruby, Swift

## References

### External Links

1. [Ubuntu Manpage: su (focal)](https://manpages.ubuntu.com/manpages/focal/en/man1/su.1.html) — official documentation for `su` behavior
2. [Linuxize: Su Command in Linux](https://linuxize.com/post/su-command-in-linux/) — `su -` changes to target user's home directory
3. [Baeldung: Why Do We Use su – and Not Just su?](https://www.baeldung.com/linux/su-command-options) — explains login shell environment reset
4. [Bun Installation Documentation](https://bun.sh/docs/installation) — Bun install script behavior
5. [Bun install script source](https://bun.sh/install) — uses `set -euo pipefail`, adds to `~/.bash_profile`

### Internal Logs

- Full CI log: `ci-run-log.txt` (saved locally during investigation)
- CI run: `gh run view 22261112919 --repo link-foundation/sandbox --log`

---

*Case study compiled: 2026-02-21*
*Investigation by: AI Issue Solver*
