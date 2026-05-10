# Docker Sandboxes Comparison

Evidence date: 2026-05-10 UTC.

This document compares Docker Sandboxes with `box` and `dind-box` for universal
software development disposable environments. AI-agent-specific features are
not treated as missing `box` requirements because `box` is intentionally
AI-agnostic. Agent launchers, model-provider-specific setup, AI memory files,
and permission-prompt behavior are listed only where they explain a Docker
Sandboxes mechanism that also has a non-AI security or workflow equivalent.

Supporting research and preserved data are in
[docs/case-studies/issue-86](case-studies/issue-86/CASE-STUDY.md).

## Sources

| Source | What it contributed |
|---|---|
| [Docker Sandboxes product page](https://www.docker.com/products/docker-sandboxes/) | Product positioning, early-access status, microVM and safety claims. |
| [Docker Sandboxes docs](https://docs.docker.com/ai/sandboxes/) | Current `sbx` behavior, install flow, security model, templates, kits, lifecycle, and usage. |
| [Isolation layers](https://docs.docker.com/ai/sandboxes/security/isolation/) | Hypervisor, network, Docker Engine, and credential-isolation model. |
| [Default security posture](https://docs.docker.com/ai/sandboxes/security/defaults/) | Deny-by-default network posture and blocked host/private access. |
| [Policies](https://docs.docker.com/ai/sandboxes/security/policy/) | Network policy commands, allow/deny rules, logs, and precedence. |
| [Credentials](https://docs.docker.com/ai/sandboxes/security/credentials/) | Host-side secret storage and proxy injection model. |
| [Usage](https://docs.docker.com/ai/sandboxes/usage/) | Branch mode, multiple workspaces, ports, lifecycle, and persistence behavior. |
| [Templates](https://docs.docker.com/ai/sandboxes/customize/templates/) | Template image variants, `-docker` variants, Docker volume sizing, and template import/export. |
| [Kits](https://docs.docker.com/ai/sandboxes/customize/kits/) | Declarative extension format for tools, files, env, credentials, network, and startup commands. |
| [docker/sbx-releases](https://github.com/docker/sbx-releases) | Public release repository for `sbx`; no template image Dockerfiles found there. |
| [docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib) | Public contributed kit specs and kit test/spec code. |
| [Docker Hub `docker/sandbox-templates`](https://hub.docker.com/r/docker/sandbox-templates/tags) | Published template tag names, update times, sizes, and amd64/arm64 manifests. |
| Local `box` docs and source | `README.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `Dockerfile`, `ubuntu/24.04/*`, and `ubuntu/24.04/dind/*`. |

## Status Legend

| Value | Meaning |
|---|---|
| Box wins | `box` is better for this non-AI development dimension today. |
| Docker wins | Docker Sandboxes has a best practice `box` does not yet provide. |
| Tie | Both cover the dimension well enough for the comparison scope. |
| Partial | `box` has the underlying primitive but lacks a comparable integrated workflow. |
| Excluded | AI-specific feature, not a missing `box` requirement. |

## Full Comparison Matrix

| Dimension | Docker Sandboxes | `box` / `dind-box` | Current advantage | Missing best practice or solution plan |
|---|---|---|---|---|
| Product scope | Disposable, isolated environments for coding agents, delivered through the standalone `sbx` CLI. | Universal Docker images for repeatable software development tasks and disposable boxes. | Box wins for non-AI universality. | Keep AI-specific agents out of `box`; document how downstream images can add them. |
| Isolation boundary | Dedicated microVM per sandbox with its own Linux kernel. | Standard Docker container namespace boundary; `dind-box` adds an inner daemon but still runs in a host container. | Docker wins. | Evaluate optional microVM-backed runners such as Kata Containers, Firecracker, Cloud Hypervisor, or QEMU/Lima wrappers. |
| Host kernel exposure | MicroVM does not share the host kernel directly. | Shares the host kernel like any Linux container. `dind-box` normally needs `--privileged` unless run with Sysbox. | Docker wins. | Add a hardened runtime guide covering Sysbox, Kata, gVisor constraints, rootless Docker feasibility, seccomp, AppArmor, and capability drops. |
| User inside environment | Non-root `agent` user with sudo in Docker Sandboxes templates. | Non-root `box` user; most tools install into user-local paths. | Tie. | No immediate gap; keep enforcing non-root defaults in image tests. |
| Sudo/admin model | Agent can use sudo inside the VM; the hypervisor is the security boundary. | `box` user has sudo in JS base image; `dind-entrypoint` starts dockerd as root then drops to `box`. | Tie for convenience; Docker wins for stronger boundary. | Document when sudo is acceptable and when a more isolated runtime is required. |
| Host filesystem access | Only configured workspaces are mounted; symlinks outside workspace scope are not followed according to docs. | Users decide mounts with `docker run -v`; no wrapper prevents mounting broader host paths. | Docker wins. | Provide recommended `docker run` and Compose profiles that mount only the project path and avoid `~`, `/`, and host socket mounts. |
| Workspace path behavior | Workspace appears at the same absolute path as the host. | Docker users choose container paths manually; examples default to `/home/box`. | Docker wins. | Optional launcher can mount the project at the same absolute path when host path is valid inside Linux containers. |
| Direct workspace edits | Default direct mount reflects changes on host immediately. | Same behavior is possible with bind mounts. | Tie. | No image change needed; add usage docs for project bind mounts. |
| Branch/worktree mode | `--branch` creates `.sbx/` Git worktrees and separate branches. | No built-in branch/worktree orchestration. Users can run `git worktree` manually. | Docker wins. | Add a small CLI or documented script that creates a disposable worktree, starts `box`, and cleans it up. |
| Multiple workspaces | Supports primary workspace plus extra read-only or read-write workspaces. | Docker supports multiple volume mounts, but `box` has no convention for role or read-only defaults. | Partial. | Add examples for `--mount type=bind,readonly` and Compose equivalents. |
| File copy outside workspaces | `sbx cp` copies files between host and sandbox. | Docker has `docker cp`; no `box`-specific wrapper. | Tie. | Mention `docker cp` in disposable workflow docs. |
| Lifecycle commands | `sbx run`, `create`, `ls`, `exec`, `stop`, `rm`, dashboard mode. | Standard Docker CLI lifecycle; no dedicated `box` lifecycle naming or dashboard. | Docker wins. | Consider `scripts/box-run.sh` or a documented Compose profile for create/list/exec/rm workflows. |
| Persistence model | VM state, packages, Docker images, and history persist until `sbx rm`. | Container state persists until removal; named volumes can persist Docker data for `dind-box`. | Tie at primitive level; Docker wins for UX. | Add documented disposable/persistent modes and cleanup commands. |
| Docker access | `-docker` templates include an isolated Docker Engine inside the microVM. | Every `*-dind` sibling includes Docker Engine, CLI, Buildx, Compose, and private dockerd. | Tie for feature; Box wins for every-language coverage. | Keep DIND variants for each language image; add runtime hardening docs. |
| Docker daemon isolation | Agent Docker commands target the sandbox daemon, not the host daemon. | `dind-box` has a private inner dockerd; README warns not to bind-mount `/var/run/docker.sock`. | Tie. | Add tests/docs that assert the host socket is not required and that inner daemon state is private. |
| Docker storage sizing | `-docker` templates use a dedicated block volume defaulting to 50 GB; `DOCKER_SANDBOXES_DOCKER_SIZE` overrides size. | `dind-box` has `DIND_DATA_ROOT` and can use a mounted volume, but no documented size preset. | Docker wins. | Document `DIND_DATA_ROOT`, named volumes, host disk expectations, and Docker `--storage-opt` where supported. |
| Port forwarding | `sbx ports` publishes sandbox services to host ports after creation. | Docker supports `-p`/`--publish` at run time; no post-start `box` helper. | Partial. | Document `docker run -p`, Compose ports, and `docker container update` limitations; consider a wrapper for port assignment. |
| Host service access | Uses `host.docker.internal` with network policy allow rules. | Docker supports `host.docker.internal` on Docker Desktop and can use `--add-host=host.docker.internal:host-gateway` on Linux. | Partial. | Add cross-platform host-service examples with explicit security notes. |
| Outbound network default | Deny-by-default for HTTP/HTTPS unless policy allows; raw TCP, UDP, ICMP, private ranges, loopback, and link-local are blocked by default. | No `box` egress policy; Docker defaults to allowing outbound network access unless user changes runtime/network settings. | Docker wins. | Add an egress-policy design using Docker internal networks, proxy allowlists, nftables/iptables, or eBPF policy tools. |
| Network policy management | `sbx policy allow`, `deny`, `ls`, `log`, `reset`, `set-default`; deny rules win. | No built-in policy store, policy log, or domain-level governance. | Docker wins. | Create a non-AI `box` launcher design for allowlisted HTTP/HTTPS proxying and auditable logs. |
| Sandbox-to-host and sandbox-to-sandbox network isolation | Docs say sandboxes cannot reach host localhost or each other by default. | Docker can isolate with custom networks, `--network none`, or internal networks, but defaults vary by invocation. | Docker wins. | Provide secure Compose examples with private networks and no host socket. |
| Credential handling | Host keychain or host environment plus host-side proxy injects credentials into outbound requests; raw secret is not inside sandbox by default. | `box` includes GitHub CLI and identity tooling, but secrets are manually mounted, configured, or passed by env. | Docker wins. | Design host-side credential broker patterns using OS keychains, Docker secrets, SSH agent forwarding, Git credential helpers, or 1Password/pass/SOPS integrations. |
| SSH agent forwarding | Supports host SSH agent forwarding and commit signing while keeping private keys on host. | Possible with Docker socket mounts for `SSH_AUTH_SOCK`, but not documented as a `box` workflow. | Docker wins. | Add SSH agent and signing examples that mount the agent socket read-only and explain risks. |
| Workspace trust guidance | Dedicated docs warn that workspace files, hooks, build files, CI, and IDE config need review. | `box` has no comparable workspace-trust checklist. | Docker wins. | Add disposable workflow security docs covering Git hooks, CI files, build scripts, `.env`, IDE tasks, and generated executables. |
| Template images | Built-in templates published as `docker/sandbox-templates:<variant>`; Dockerfile-based custom templates can extend them. | `box` images are normal OCI base images and can be extended with Dockerfiles. | Tie for OCI extensibility; Docker wins for template catalog. | Add a lightweight template catalog or examples directory for common non-AI development setups. |
| Runtime snapshot templates | `sbx template save`, `load`, `ls`, `rm`, import/export tar. | Docker can `commit`, `save`, and `load`; `box` has no curated workflow and Docker commit is usually less reproducible than Dockerfiles. | Docker wins. | Prefer reproducible Dockerfiles, but document when `docker commit`/`save` is acceptable for experiments. |
| Declarative extensions | Experimental kits declare tools, env, files, credentials, network domains, install/startup commands, and agent definitions. | No kit/feature system. Users extend images or scripts directly. | Docker wins. | Evaluate Dev Container Features, OCI artifacts, or a simple `box-feature.yaml` model for non-AI mixins. |
| Kit validation and distribution | `sbx kit validate`, `inspect`, `pack`, `push`, and `pull`; supports local, Git, ZIP, and OCI references. | No equivalent. | Docker wins. | If a feature system is added, include validation, versioning, and registry/distribution rules from the start. |
| Base OS | Ubuntu-based templates; Docker Desktop-integrated legacy page mentioned a shared base environment. | Ubuntu 24.04 source tree and images. | Box wins for explicit source-level OS version. | Keep Ubuntu version explicit in image tags/docs. |
| Universal runtime breadth | Template docs say most variants include common dev tools such as Node.js, Python, Go, Java, Git, Docker CLI. | Full image includes Node.js, Python, Go, Rust, Java, Kotlin, PHP, Perl, Ruby, Swift, R, .NET, C/C++, Assembly, Lean, Rocq/Coq, browser deps, and build tools. | Box wins. | Preserve universal scope; do not narrow `box` into an AI-agent image. |
| Theorem provers | No public Sandboxes docs evidence of Lean or Rocq/Coq in base templates. | Lean and Rocq/Coq are first-class images and part of the full box. | Box wins. | Keep theorem prover support as a differentiator. |
| Browser automation dependencies | No public Sandboxes docs evidence of a universal Playwright/Puppeteer dependency layer. | JS base installs Playwright/Puppeteer browser system dependencies and fonts. | Box wins. | Consider documenting this explicitly as a web/UI testing feature. |
| Modular image variants | Template variants are agent-focused plus `-docker` variants. | Per-language images plus a `dind` sibling for every language and full image. | Box wins. | Keep language-focused modular matrix; add a docs table mapping use cases to smallest image. |
| Multi-architecture images | Docker Hub metadata shows `docker/sandbox-templates` tags with linux/amd64 and linux/arm64 images. | README and Docker Hub metadata show linux/amd64 and linux/arm64 images. | Tie. | Continue native ARM64 CI and avoid emulation. |
| Registry availability | Docker templates are on Docker Hub; docs say private templates are only supported on Docker Hub. | `box` publishes to Docker Hub and GHCR. | Box wins. | Keep both registries; consider documenting private-registry expectations for downstream images. |
| Public image source | Public docs and kit specs are available, but Dockerfile/source for `docker/sandbox-templates` images was not found in public Docker-owned repos during this research. | Image Dockerfiles and install scripts are in this repo. | Box wins. | Keep image build source public and link source files from docs. |
| Public release process | `docker/sbx-releases` publishes binaries/releases; template build pipeline is not visible in found sources. | CI workflow, release scripts, and image assembly are visible in this repo. | Box wins. | Add provenance/SBOM/scanning follow-up to strengthen visible supply-chain posture. |
| Image size | Docker Hub reported `shell-docker` at about 550 MiB and `codex-docker` at about 729 MiB. | Docker Hub reported `konard/box:latest` at about 5.47 GiB and `konard/box-dind:latest` at about 5.59 GiB for amd64. | Docker wins for smaller base; Box wins for breadth. | Improve smallest-image guidance and consider optional slim image families rather than shrinking the full universal image. |
| Authentication to product | `sbx login` with Docker account is required. | Pulling and running public `box` images requires no product login beyond registry access rules. | Box wins. | Keep no-login local workflows. |
| Telemetry | Docker docs say the `sbx` CLI collects basic invocation telemetry unless `SBX_NO_TELEMETRY=1`. | No `box` CLI telemetry exists. | Box wins. | If a `box` CLI is added, default to no telemetry or make it explicit and opt-in. |
| Docker Desktop dependency | Current `sbx` docs say Docker Desktop is not required; custom template builds need Docker Desktop according to the templates page. | `box` needs any compatible Docker/OCI runtime to pull/run images; building images uses Docker/Buildx in CI. | Tie for runtime; Box wins for simpler local mental model. | Document Podman/containerd compatibility only after testing. |
| Admin/team governance | Product page offers admin controls for teams, network restrictions, filesystem policies, and centralized setup via sales path. | No centralized governance product. | Docker wins for teams that need admin controls. | Out of scope for image-only `box`; possible future launcher can emit policy files. |
| AI agent integrations | Built-in agent names and templates include Claude Code, Codex, Copilot, Gemini, OpenCode, Kiro, Droid, Docker Agent, and shell. | `box` deliberately excludes AI-specific agent packages. | Excluded. | Do not add AI-specific dependencies to base `box`; downstream images can inherit from `box`. |

## Where `box` Is Better

| Area | Why it is better for this repository's scope |
|---|---|
| Universal toolchain breadth | The full image covers many runtimes and build stacks, including theorem provers and browser automation dependencies, instead of optimizing around AI agent templates. |
| Public build source | Dockerfiles, install scripts, DIND entrypoint, requirements, architecture notes, and CI are all in this repository. |
| Modular language images | Users can select `konard/box-<language>` or a matching `-dind` sibling instead of only choosing an agent-oriented template. |
| Registry coverage | Images are published to Docker Hub and GHCR. |
| No product login | Public image pull/run workflows do not require `sbx login` or Docker Sandboxes account setup. |
| AI-agnostic base | The base image stays reusable for human development, CI experiments, automation, and any downstream AI or non-AI workflow. |

## Missing Best Practices To Consider

| Priority | Gap | Proposed plan | Existing components to evaluate |
|---|---|---|---|
| P0 | Stronger isolation option for untrusted autonomous work. | Add a design doc and tested examples for running `box` under hardened runtimes. Keep plain Docker as the default image consumption path. | Sysbox, Kata Containers, Firecracker, Cloud Hypervisor, gVisor, Lima/Colima, QEMU. |
| P0 | Egress policy and network logs. | Create secure run profiles for `--network none`, allowlisted proxies, and internal Docker networks. Consider a wrapper that writes and enforces domain rules. | Docker networks, nftables/iptables, Cilium, Envoy, mitmproxy, Squid/tinyproxy, Open Policy Agent. |
| P0 | Host-side credential brokering. | Document safe patterns first: SSH agent forwarding, Git credential helpers, Docker secrets, and keychain-backed CLIs. Design a proxy only if there is a clear non-AI use case. | Docker secrets, SSH agent, Git credential helpers, 1Password CLI, pass/gopass, SOPS, OS keychains. |
| P1 | Workspace branch/lifecycle orchestration. | Add a small `box run` helper or examples that create Git worktrees, mount them, run containers, and clean up. | Git worktree, Docker Compose, Dev Containers CLI, Dagger. |
| P1 | Template/feature catalog. | Publish a non-AI catalog of reusable Dockerfile patterns or declarative feature specs. Avoid coupling to specific agents. | Dev Container Features, OCI artifacts, Docker Compose, Nix flakes, mise. |
| P1 | DIND storage and resource controls. | Document `DIND_DATA_ROOT`, named volumes, `--cpus`, `--memory`, `--pids-limit`, and cleanup commands. Add smoke tests for DIND data-root overrides. | Docker cgroups flags, Compose resource options, BuildKit cache mounts. |
| P1 | Port and host-service workflow. | Add examples for `-p`, Compose ports, `host.docker.internal`, and Linux `host-gateway`. | Docker CLI, Docker Compose. |
| P2 | Supply-chain metadata. | Add SBOM/scanning/provenance docs and eventually CI artifacts. | Syft, Grype, Trivy, Docker Scout, cosign, SLSA, in-toto. |
| P2 | Workspace trust checklist. | Document post-session review guidance for Git hooks, CI files, build scripts, IDE tasks, `.env`, and generated executables. | Git, pre-commit, shellcheck, static analyzers. |

## Decision

`box` should not clone Docker Sandboxes as an AI-agent product. The best
borrowed practices are the non-AI environment controls: stronger isolation
options, network governance, secret handling, workspace lifecycle helpers,
template/feature reuse, DIND storage controls, and supply-chain metadata.
The strongest `box` differentiators are still its open, universal, modular,
multi-language images and public build source.
