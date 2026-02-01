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
|  |  |Java/| | PHP  | |Perl | |Ruby |  |  |
|  |  |Kotln| |(brew)|(perl | |(rbenv|  |  |
|  |  |(sdk | |      | brew) |)     |  |  |
|  |  | man)| |      |       |       |  |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  |  +-----+ +------+ +-----+ +-----+  |  |
|  |  |Swift| | R    | |.NET | |Assem|  |  |
|  |  |(~/.s| |(sys) |(sys) | |bly  |  |  |
|  |  |wift)| |      |       | tools |  |  |
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

**IMPORTANT: ARM64 builds MUST use native ARM64 runners.**

Reason: Emulation incurs a 10-30x performance penalty, making builds that take 30-60 minutes natively run for 6+ hours (or timeout entirely).

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
└────────┬────────┘     │ (NATIVE - NO EMU)   │
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
│       └── release.yml              # CI/CD workflow
├── ubuntu/
│   └── 24.04/
│       ├── common.sh                # Shared functions for all install scripts
│       ├── js/                      # JavaScript/TypeScript (Node.js, Bun, Deno)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── python/                  # Python (Pyenv)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── go/                      # Go
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── rust/                    # Rust (rustup)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── java/                    # Java (SDKMAN, Temurin)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── kotlin/                  # Kotlin (SDKMAN)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── dotnet/                  # .NET SDK 8.0
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── r/                       # R language
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── ruby/                    # Ruby (rbenv)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── php/                     # PHP 8.3 (Homebrew)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── perl/                    # Perl (Perlbrew)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── swift/                   # Swift 6.x
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── lean/                    # Lean (elan)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── rocq/                    # Rocq/Coq (Opam)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── cpp/                     # C/C++ (CMake, Clang, LLVM)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── assembly/                # Assembly (NASM, FASM)
│       │   ├── install.sh
│       │   └── Dockerfile
│       ├── essentials-sandbox/      # Minimal sandbox (git identity tools)
│       │   ├── install.sh
│       │   └── Dockerfile
│       └── full-sandbox/            # Complete sandbox (all languages)
│           ├── install.sh
│           └── Dockerfile
├── scripts/
│   ├── ubuntu-24-server-install.sh  # Legacy full installation script
│   ├── entrypoint.sh                # Container entrypoint
│   ├── measure-disk-space.sh        # Disk space measurement
│   └── ...                          # Other scripts
├── docs/
│   └── case-studies/                # Case studies
├── data/                            # Data files
├── experiments/                     # Experimental scripts
├── Dockerfile                       # Root Dockerfile (full sandbox)
├── README.md                        # Project overview
├── ARCHITECTURE.md                  # This file
├── REQUIREMENTS.md                  # Project requirements
└── LICENSE                          # MIT License
```

## Modular Design

The sandbox follows a layered modular architecture:

```
┌─────────────────────────────────────────────┐
│              full-sandbox                    │
│  (konard/sandbox or konard/sandbox-full)     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │        essentials-sandbox           │    │
│  │  (konard/sandbox-essentials)        │    │
│  │                                     │    │
│  │  git, gh, glab, Node.js, Bun,      │    │
│  │  Deno, gh-setup-git-identity,      │    │
│  │  glab-setup-git-identity           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  + Python, Go, Rust, Java, Kotlin, .NET,    │
│    R, Ruby, PHP, Perl, Swift, Lean, Rocq,   │
│    C/C++, Assembly                          │
└─────────────────────────────────────────────┘

Each language also available as standalone:
┌────┐ ┌────────┐ ┌────┐ ┌──────┐ ┌──────┐
│ JS │ │ Python │ │ Go │ │ Rust │ │ ... │
└────┘ └────────┘ └────┘ └──────┘ └──────┘
```

### Benefits

1. **Configurable disk usage**: Users can choose only the languages they need
2. **Parallel CI/CD**: Each language image can be built and tested independently
3. **Faster iteration**: Changes to one language only rebuild that image
4. **Standalone scripts**: Each `install.sh` works directly on Ubuntu 24.04 via `curl | bash`

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
- Avoid emulation entirely
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

### Why Emulation is Prohibited

User-mode emulation translates every instruction at runtime:

| Metric | Native | Emulated |
|--------|--------|----------|
| Simple operations | 1x | ~2-5x slower |
| Compilation (gcc, etc.) | 1x | 10-30x slower |
| Full build | 30-60 min | 6+ hours |

For compilation-heavy workloads like this image, emulation makes builds impractical.

## References

- [GitHub: Linux arm64 hosted runners for free](https://github.blog/changelog/2025-01-16-linux-arm64-hosted-runners-now-available-for-free-in-public-repositories-public-preview/)
- [Emulation performance issues](https://github.com/docker/build-push-action/issues/982)
- [Case Study: Issue #7 Analysis](docs/case-studies/issue-7/README.md)
