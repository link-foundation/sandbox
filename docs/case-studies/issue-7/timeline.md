# Detailed Timeline: Docker ARM64 Build Timeout

**Run ID:** 21002878662
**Date:** 2026-01-14
**Total Duration:** ~6 hours (cancelled)

## Jobs Overview

| Job | Start Time | End Time | Duration | Result |
|-----|------------|----------|----------|--------|
| detect-changes | 17:04:50 | 17:04:55 | 5s | Success |
| docker-build-push (amd64) | 17:04:57 | 17:05:27 | 30s | Success |
| docker-build-test | - | - | Skipped | N/A |
| docker-build-push-arm64 | 17:05:31 | 23:05:51 | 5h 59m 20s | Cancelled |
| docker-manifest | - | - | Skipped | N/A |

## Detailed ARM64 Build Timeline

### Phase 1: Setup (17:05:31 - 17:05:54)
- Set up job: 7 seconds
- Checkout repository: 1 second
- Set up emulation: 8 seconds
- Set up Docker Buildx: 5 seconds
- Log in to GHCR: 1 second
- Extract metadata: 1 second

### Phase 2: System Prerequisites (17:05:54 - ~17:30:00)
- Ubuntu apt update and package installation
- Build-essential, CMake, Clang, LLVM installed
- Python build dependencies installed
- GitHub CLI installed

### Phase 3: User Tools Installation (17:30:00 - ~17:40:00)
- Bun installed
- Deno installed
- NVM installed
- Pyenv installed
- Python 3.13.x compiled from source (~10 minutes)
- Go installed (pre-compiled binary)
- Rust installed (pre-compiled binary)
- SDKMAN installed
- Java 21 Temurin installed (pre-compiled binary)
- Lean/elan installed (pre-compiled binary)

### Phase 4: Opam/OCaml Installation (17:52:43 - 18:02:24)
- Opam package manager installed via apt
- Opam initialized
- OCaml packages configured
- Duration: ~10 minutes

### Phase 5: Rocq Prover Installation (18:02:25 - 19:05:42)
- **Total Duration: ~63 minutes**

#### Breakdown:
| Package | Start | End | Duration |
|---------|-------|-----|----------|
| dune.3.20.2 | 18:05:33 | 18:14:54 | ~9 min |
| rocq-runtime.9.1.0 | 18:14:54 | 18:29:33 | ~15 min |
| rocq-core.9.1.0 | 18:29:33 | 18:31:12 | ~2 min |
| rocq-stdlib.9.0.0 | 18:31:12 | 19:05:37 | **~34 min** |
| rocq-prover.meta.1 | 19:05:37 | 19:05:39 | 2 sec |

### Phase 6: Homebrew Installation (19:05:43 - 19:07:31)
- Homebrew installed at /home/linuxbrew/.linuxbrew
- Duration: ~2 minutes (mostly downloading)

### Phase 7: PHP Installation (19:07:32 - 23:05:31)
- **This is where the build got stuck**
- Duration before cancellation: **~4 hours**
- Status: INCOMPLETE - Still compiling when cancelled

```
2026-01-14T19:07:32.0748260Z #10 7294.5 [*] Installing PHP via Homebrew...
...
2026-01-14T23:05:31.5906083Z ##[error]The operation was canceled.
```

## Key Observations

### 1. Compiled vs Pre-built Installation Times

| Tool | Installation Method | Duration | Notes |
|------|---------------------|----------|-------|
| Go | Pre-built binary | ~30 sec | Fast |
| Rust | Pre-built binary | ~30 sec | Fast |
| Java | Pre-built binary | ~1 min | Fast |
| Lean | Pre-built binary | ~30 sec | Fast |
| Python | Compiled from source | ~10 min | Slow |
| Rocq | Compiled from source | ~63 min | Very slow |
| PHP | Compiled from source | 4+ hours (incomplete) | Extremely slow |

### 2. Emulation Performance Impact

The emulation overhead is visible in the timestamps:
- Simple downloads/extractions: Normal speed
- Compilation tasks: 10-30x slower than native

### 3. Bottleneck Analysis

```
Percentage of build time spent:
- Setup/Config: ~2% (7 minutes)
- Opam/OCaml: ~3% (10 minutes)
- Rocq Prover: ~18% (63 minutes)
- PHP via Homebrew: ~77% (240+ minutes, incomplete)
```

## Log File Excerpts

### Last Successful Output Before Timeout
```
2026-01-14T19:07:32.0748260Z #10 7294.5 [*] Installing PHP via Homebrew...
```

### Cancellation Message
```
2026-01-14T23:05:31.5906083Z ##[error]The operation was canceled.
2026-01-14T23:05:31.5982756Z Post job cleanup.
```

### Job Conclusion
```json
{
  "name": "docker-build-push-arm64",
  "conclusion": "cancelled",
  "startedAt": "2026-01-14T17:05:31Z",
  "completedAt": "2026-01-14T23:05:51Z"
}
```

## Files

- [Main Analysis](./README.md) - Root cause analysis and solutions
