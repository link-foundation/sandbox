# sandbox

A Docker container image that contains most popular language runtimes and tools to be reused for multiple software development tasks.

## Overview

This sandbox provides a pre-configured development environment with common language runtimes installed. It is designed to be AI-agnostic and can be used as a base image for various development workflows.

## Included Runtimes & Tools

### Programming Languages
- **Node.js 20** (via NVM) + npm + Bun + Deno
- **Python** (latest stable via pyenv)
- **Go** (latest stable)
- **Rust** (via rustup) + Cargo
- **Java 21 LTS** (Eclipse Temurin via SDKMAN)
- **Kotlin** (via SDKMAN)
- **PHP 8.3** (via Homebrew)
- **Perl** (latest stable via Perlbrew)
- **Ruby** (latest stable via rbenv)
- **Swift 6.x** (latest stable)
- **R** (latest stable)
- **.NET SDK 8.0**
- **Assembly** (GNU Assembler, NASM, LLVM-MC, FASM)

### Theorem Provers
- **Lean** (via elan)
- **Rocq/Coq** (via opam)

### Build Tools
- **CMake**
- **Make**
- **GCC/G++**
- **Clang/Clang++**
- **LLVM**
- **LLD Linker**

### Development Tools
- **Git**
- **GitHub CLI (gh)**
- **Homebrew**

## Usage

### Pull the image

```bash
docker pull ghcr.io/link-foundation/sandbox:latest
```

### Run interactively

```bash
docker run -it ghcr.io/link-foundation/sandbox:latest
```

### Use as base image

```dockerfile
FROM ghcr.io/link-foundation/sandbox:latest

# Your additional setup here
COPY . /workspace
RUN npm install
```

### Build locally

```bash
git clone https://github.com/link-foundation/sandbox.git
cd sandbox
docker build -t sandbox .
```

## Architecture Support

The image is built for both `linux/amd64` and `linux/arm64` architectures.

### CI/CD Build Requirements

**IMPORTANT: ARM64 builds MUST use native ARM64 runners.**

| Architecture | Runner | Build Time |
|-------------|--------|------------|
| `linux/amd64` | `ubuntu-latest` | ~5-10 minutes |
| `linux/arm64` | `ubuntu-24.04-arm` (native) | ~30-60 minutes |

Native ARM64 runners provide optimal build performance for compilation-heavy workloads. Emulation would incur a 10-30x performance penalty.

For detailed analysis, see [Case Study: Issue #7](docs/case-studies/issue-7/README.md).

## Environment

The container runs as the `sandbox` user with home directory at `/home/sandbox`. All language runtimes are installed in user-local directories:

- Node.js: `~/.nvm`
- Python: `~/.pyenv`
- Go: `~/.go`
- Rust: `~/.cargo`
- Java/Kotlin: `~/.sdkman`
- Ruby: `~/.rbenv`
- Swift: `~/.swift`
- Lean: `~/.elan`
- Perl: `~/.perl5`
- OCaml/Rocq: `~/.opam`

<!-- COMPONENT_SIZES_START -->
## Component Sizes

_Last updated: _

**Total installation size: 0 MB**

| Component | Category | Size (MB) |
|-----------|----------|-----------|
| Essential Tools | System | 0 |

_Note: Sizes are measured after cleanup and may vary based on system state and package versions._

<!-- COMPONENT_SIZES_END -->

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- [REQUIREMENTS.md](REQUIREMENTS.md) - Project requirements and constraints
- [docs/case-studies/](docs/case-studies/) - Case studies and incident analysis

## License

MIT License - see [LICENSE](LICENSE) for details.
