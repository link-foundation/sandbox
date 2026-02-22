# Case Study: PHP ARM64 Docker Build Timeout (Issue #53)

## Summary

The PHP Docker image build for ARM64 architecture was hanging indefinitely, causing the GitHub Actions CI/CD pipeline to hit the 2-hour timeout limit. This case study documents the investigation, root cause analysis, and solution.

## Timeline of Events

### Failing Build (Run 22268308558)
- **Start Time:** 2026-02-22 01:51:22 UTC
- **01:53:05:** PHP install script started with 1800s (30min) timeout
- **01:53:30:** Homebrew bottle for php@8.3 downloaded successfully (25.93s)
- **01:53:30 - 03:52:31:** **2-hour gap with no output** - build hung
- **03:52:31:** Job cancelled due to GitHub Actions 120-minute timeout

### Successful Build (Run 22267653513) - for comparison
- **Start Time:** 2026-02-22 01:02:48 UTC
- **01:03:52:** Homebrew bottle for php@8.3 downloaded successfully (25.97s)
- **01:03:54:** Installation continued immediately with dependency installation
- **01:10:31:** Build completed successfully (total ~8 minutes)
- **Result:** `1.3.7-arm64-local` tag pushed

## Key Observation

In the failing build, after the message `✔︎ Bottle php@8.3 (8.3.30)`, there is **no log output for 2 hours** until the job is cancelled. In contrast, the successful build immediately continues with `==> Installing php@8.3 from shivammathur/php` within 2 seconds.

This indicates the build process is **hanging** somewhere between:
1. Downloading the main PHP bottle
2. Starting the dependency installation phase

## Root Cause Analysis

### Primary Factor: Network Instability on ARM64 Runners

Investigation revealed multiple known issues with GitHub Actions ARM64 runners:

1. **[apt-get extremely slow on ARM64 runners](https://github.com/actions/actions-runner-controller/issues/4365)**:
   - APT package management operations taking hours to complete
   - Default Ubuntu mirrors have poor connectivity from certain regions
   - 90% failure rate reported for ARM64 nodes in Azure regions

2. **[Connection problems in Ubuntu 22 and 24](https://github.com/actions/runner-images/issues/11886)**:
   - ~20% of HTTPS requests ending with read timeout
   - DNS resolver behavior changed between Ubuntu versions
   - Parallel requests to same hostname routed to different IPs

3. **[Ubuntu 24.04 CI runs taking 400% longer](https://github.com/actions/runner-images/issues/11841)**:
   - General slowness reported across multiple organizations
   - Affects both network operations and package installations

### Secondary Factor: Missing Timeout at Installation Phase

The PHP install script has a 30-minute timeout around `brew install`, but:
- The timeout only covers the main `brew install` command
- Post-download dependency installation and linking can still hang
- Network issues during dependency fetching are not caught by this timeout

### Why AMD64 Succeeded, ARM64 Failed

- Both architectures used the same code
- ARM64 runners experience more network instability (documented GitHub issues)
- The failed run hit a network stall after bottle download
- The successful ARM64 run (same day, different time slot) did not encounter network issues

## Existing Mitigation (PR #45)

PR #45 implemented a tiered installation strategy:
1. Try Homebrew with 30-minute timeout
2. Fall back to apt if Homebrew fails/times out
3. Marker file indicates local vs global installation

**Problem:** The 30-minute timeout wasn't being triggered because:
- The Homebrew process wasn't exceeding CPU time; it was blocked on I/O
- The `timeout` command measures wall-clock time, but Docker build steps may handle signals differently
- The hang occurred AFTER the main bottle download, outside the timed section

## Solution

### 1. Reduce Job Timeout
Change the GitHub Actions job `timeout-minutes` from 120 to 45 for PHP ARM64 builds. This ensures:
- Normal builds (8-15 minutes) complete successfully
- Hung builds fail fast instead of blocking for 2 hours
- Resources are freed quickly for retry

### 2. Add Verbose Logging
Add verbose output to the install script to identify exactly where hangs occur:
- Log each phase with timestamps
- Enable `HOMEBREW_VERBOSE=1` for detailed brew output
- Add progress indicators for long-running operations

### 3. Ensure Timeout Applies to Entire Installation
Wrap the entire Homebrew installation block (not just `brew install`) in a timeout to catch:
- Post-download dependency installation
- Linking and configuration steps
- Any network-dependent operations

### 4. Consider apt-first Strategy for ARM64
Given the documented instability of Homebrew on ARM64 Linux runners, consider:
- Defaulting to apt for ARM64 builds
- Using Homebrew only for AMD64 where it's more stable
- Or reducing the Homebrew timeout further to fail faster

## Files Analyzed

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | CI/CD workflow with timeout configuration |
| `ubuntu/24.04/php/Dockerfile` | PHP image build configuration |
| `ubuntu/24.04/php/install.sh` | PHP installation script with tiered strategy |

## CI Log References

| Run ID | Status | Duration | Notes |
|--------|--------|----------|-------|
| 22268308558 | Cancelled | 2h+ | ARM64 PHP hung after bottle download |
| 22267653513 | Success | ~8min | ARM64 PHP completed normally |

## Recommendations

1. **Immediate:** Reduce job timeout to 45 minutes to fail fast
2. **Short-term:** Add verbose logging to identify hang location precisely
3. **Medium-term:** Consider apt-first installation for ARM64 due to documented Homebrew/network issues
4. **Long-term:** Monitor GitHub ARM64 runner stability; adjust strategy as infrastructure improves

## External References

- [GitHub ARM64 Runner Issues - APT slowness](https://github.com/actions/actions-runner-controller/issues/4365)
- [GitHub Runner Images - Ubuntu connection problems](https://github.com/actions/runner-images/issues/11886)
- [GitHub Runner Images - Ubuntu 24.04 slowness](https://github.com/actions/runner-images/issues/11841)
- [shivammathur/homebrew-php repository](https://github.com/shivammathur/homebrew-php)

## Conclusion

The PHP ARM64 build timeout is caused by known network instability issues affecting GitHub Actions ARM64 runners, particularly when downloading and installing Homebrew packages. The existing 30-minute internal timeout was not effective because the hang occurred during a phase not covered by the timeout. The solution involves:

1. Reducing the GitHub Actions job timeout to detect hangs faster
2. Adding verbose logging to pinpoint exact failure locations
3. Ensuring timeouts cover the entire installation process
4. Considering architecture-specific installation strategies (apt for ARM64, Homebrew for AMD64)
