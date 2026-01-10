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
- **PHP 8.3** (via Homebrew)
- **Perl** (latest stable via Perlbrew)
- **.NET SDK 8.0**

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

## Environment

The container runs as the `sandbox` user with home directory at `/home/sandbox`. All language runtimes are installed in user-local directories:

- Node.js: `~/.nvm`
- Python: `~/.pyenv`
- Go: `~/.go`
- Rust: `~/.cargo`
- Java: `~/.sdkman`
- Lean: `~/.elan`
- Perl: `~/.perl5`
- OCaml/Rocq: `~/.opam`

## License

MIT License - see [LICENSE](LICENSE) for details.
