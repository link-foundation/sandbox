# Architecture

This document describes the architecture and design decisions for the sandbox Docker image project.

## Overview

The sandbox is a multi-architecture Docker image that provides a comprehensive development environment with popular programming language runtimes and tools pre-installed. It is designed to be used as a base image for AI-assisted development workflows.

## System Architecture

```
+------------------------------------------+
|           Docker Container               |
|  +------------------------------------+  |
|  |     User: sandbox (non-root)       |  |
|  |     Home: /home/sandbox            |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |      Language Runtimes             |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  |  |Node | |Python| | Go  | |Rust |  |  |
|  |  |.js  | |(pyenv)|(~/.go)|(cargo)|  |  |
|  |  |(nvm)| |      |       |       |  |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  |  |Java | | PHP  | |Perl | |.NET |  |  |
|  |  |(sdk | |(brew)|(perl | |(sys)|  |  |
|  |  | man)|       | brew) |       |  |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |     Theorem Provers                |  |
|  |  +------+  +------+                |  |
|  |  | Lean |  | Rocq |                |  |
|  |  |(elan)|  |(opam)|                |  |
|  |  +------+  +------+                |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |     Build Tools                    |  |
|  |  CMake, Make, GCC, Clang, LLVM     |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |     Development Tools              |  |
|  |  Git, GitHub CLI (gh), Homebrew    |  |
|  +------------------------------------+  |
+------------------------------------------+
         |                   |
    linux/amd64         linux/arm64
```

## Multi-Architecture Support

The image is built for two architectures:

| Architecture | Runner Type | Build Time |
|-------------|-------------|------------|
| `linux/amd64` | `ubuntu-latest` | ~5-10 minutes |
| `linux/arm64` | `ubuntu-24.04-arm` (native) | ~30-60 minutes |

### Critical: Native ARM64 Runners Only

**IMPORTANT: ARM64 builds MUST use native ARM64 runners. QEMU emulation is strictly prohibited.**

Reason: QEMU emulation incurs a 10-30x performance penalty, making builds that take 30-60 minutes natively run for 6+ hours (or timeout entirely).

See [Case Study: Docker ARM64 Build Timeout](docs/case-studies/issue-7/README.md) for detailed analysis.

## Build Pipeline

```
┌─────────────────┐
│ detect-changes  │
│ (ubuntu-latest) │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│docker-build-push│     │docker-build-push-   │
│    (amd64)      │     │      arm64          │
│ ubuntu-latest   │     │ ubuntu-24.04-arm    │
└────────┬────────┘     │ (NATIVE - NO QEMU)  │
         │              └──────────┬──────────┘
         │                         │
         └──────────┬──────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ docker-manifest │
          │ (multi-arch)    │
          └─────────────────┘
```

## File Structure

```
sandbox/
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD workflow
├── docs/
│   └── case-studies/
│       └── issue-7/             # ARM64 timeout analysis
├── scripts/
│   └── ...                      # Build scripts
├── data/
│   └── ...                      # Data files
├── experiments/
│   └── ...                      # Experimental scripts
├── Dockerfile                   # Main container definition
├── README.md                    # Project overview
├── ARCHITECTURE.md              # This file
├── REQUIREMENTS.md              # Project requirements
├── LICENSE                      # MIT License
└── package.json                 # Node.js metadata
```

## Design Decisions

### 1. Non-Root User

The container runs as a non-root user (`sandbox`) for security. All language runtimes are installed in user-local directories.

### 2. Version Managers

Most languages use version managers (nvm, pyenv, sdkman, etc.) to:
- Allow easy version switching
- Keep installations in user space
- Provide consistent cross-platform behavior

### 3. Separate Architecture Jobs

ARM64 and AMD64 builds run as separate jobs (not a single multi-platform build) to:
- Use native runners for each architecture
- Avoid QEMU emulation entirely
- Enable parallel building when runners are available

### 4. Homebrew for PHP

PHP is installed via Homebrew because:
- Provides consistent installation across architectures
- Easier to manage PHP extensions
- Works reliably on both AMD64 and ARM64

Note: This requires compilation on ARM64 Linux (no pre-built bottles), which is why native ARM64 runners are essential.

## Performance Considerations

### Build Time Optimization

1. **Native runners**: Always use architecture-native runners
2. **Caching**: GitHub Actions cache for Docker layers
3. **Timeout protection**: 120-minute safety timeout on ARM64 job

### Why QEMU is Prohibited

QEMU user-mode emulation translates every instruction at runtime:

| Metric | Native | QEMU Emulated |
|--------|--------|---------------|
| Simple operations | 1x | ~2-5x slower |
| Compilation (gcc, etc.) | 1x | 10-30x slower |
| Full build | 30-60 min | 6+ hours |

For compilation-heavy workloads like this image, QEMU makes builds impractical.

## References

- [GitHub: Linux arm64 hosted runners for free](https://github.blog/changelog/2025-01-16-linux-arm64-hosted-runners-now-available-for-free-in-public-repositories-public-preview/)
- [QEMU performance issues](https://github.com/docker/setup-qemu-action/issues/22)
- [Case Study: Issue #7 Analysis](docs/case-studies/issue-7/README.md)
