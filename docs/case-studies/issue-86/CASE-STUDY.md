# Case Study: Issue #86 - Docker Sandboxes Feature Comparison

## Summary

Issue #86 asks for a complete non-AI comparison of Docker Sandboxes against
`box`, with data preserved in `docs/case-studies/issue-86`, a requirements
breakdown, missing best practices, and solution plans.

The comparison is implemented in
[docs/docker-sandboxes-comparison.md](../../docker-sandboxes-comparison.md).
The strongest Docker Sandboxes practices to consider are not agent integrations;
they are environment-control practices: microVM isolation, deny-by-default
network policies, host-side credential proxying, workspace/worktree lifecycle
management, port forwarding, templates, kits, and resource governance. The
strongest `box` advantages are its universal toolchain breadth, public image
source, per-language modular images, matching `-dind` variants, GHCR plus Docker
Hub publishing, and no product-login requirement.

## Data Preserved

| File | Purpose |
|---|---|
| [`issue.md`](./issue.md) | Issue snapshot. |
| [`DATA-COLLECTION.md`](./DATA-COLLECTION.md) | Research commands, source links, source-code search notes, and metadata summary. |
| [`data/issue-86.json`](./data/issue-86.json) | Machine-readable issue metadata. |
| [`data/docker-sandbox-templates-tags.json`](./data/docker-sandbox-templates-tags.json) | Docker Hub metadata for Docker Sandboxes template images. |
| [`data/konard-box-latest-tag.json`](./data/konard-box-latest-tag.json) | Docker Hub metadata for `konard/box:latest`. |
| [`data/konard-box-dind-latest-tag.json`](./data/konard-box-dind-latest-tag.json) | Docker Hub metadata for `konard/box-dind:latest`. |
| [`data/docker-sbx-releases.json`](./data/docker-sbx-releases.json) | `docker/sbx-releases` repository metadata. |
| [`data/docker-sbx-releases-list.txt`](./data/docker-sbx-releases-list.txt) | Recent `sbx` release list. |
| [`data/docker-sbx-kits-contrib.json`](./data/docker-sbx-kits-contrib.json) | `docker/sbx-kits-contrib` repository metadata. |
| [`data/docker-sbx-kits-contrib-root.txt`](./data/docker-sbx-kits-contrib-root.txt) | Public kit repository root listing. |
| [`data/docker-code-search-sandbox-templates.txt`](./data/docker-code-search-sandbox-templates.txt) | Docker-owned GitHub code search results for `sandbox-templates`. |
| [`data/docker-docs-sandboxes-paths.txt`](./data/docker-docs-sandboxes-paths.txt) | Docker docs source path listing for Sandboxes docs. |

## Requirements Extracted From Issue #86

| ID | Requirement | Status in this PR |
|---|---|---|
| REQ-86.1 | Create a full comparison matrix in `./docs`. | Done in [`docs/docker-sandboxes-comparison.md`](../../docker-sandboxes-comparison.md). |
| REQ-86.2 | Exclude AI-related items because `box` is universal. | Done. AI-agent integrations are marked `Excluded` and not treated as gaps. |
| REQ-86.3 | Find image source if possible, otherwise use documentation. | Done. Public Dockerfile/source for `docker/sandbox-templates` images was not found in Docker-owned GitHub search results, so docs and Docker Hub metadata are used. |
| REQ-86.4 | List all missing best practices. | Done in the comparison matrix and the gap plan below. |
| REQ-86.5 | Clearly show where `box` is better. | Done in the matrix and the `Where box is better` section. |
| REQ-86.6 | Collect issue-related data under `docs/case-studies/issue-86`. | Done. Metadata and command outputs are preserved in `data/`. |
| REQ-86.7 | Search online for additional facts and data. | Done through Docker docs, Docker product page, Docker Hub API, GitHub repos, and GitHub code search. |
| REQ-86.8 | List each requirement from the issue. | Done in this table. |
| REQ-86.9 | Propose possible solutions and plans for each requirement. | Done in this case study and the root comparison document. |
| REQ-86.10 | Check known existing components/libraries that solve similar problems. | Done in the component table below. |
| REQ-86.11 | Execute everything in one PR. | Done in PR #87. |

## Source Findings

### Docker Sandboxes

Docker Sandboxes is an early-access `sbx` product documented as isolated
microVM sandboxes with per-sandbox filesystem, network, and Docker daemon
state. The docs describe:

- standalone `sbx` CLI install for macOS, Windows, and Ubuntu;
- KVM requirement on Ubuntu;
- Docker Desktop not required for current `sbx` usage;
- microVM isolation with a separate Linux kernel per sandbox;
- direct workspace mounts and same absolute workspace paths;
- branch mode based on Git worktrees under `.sbx/`;
- multiple workspaces with read-only options;
- private Docker Engine in `-docker` template variants;
- post-start port publishing with `sbx ports`;
- deny-by-default network policies with allow/deny rules and logs;
- host-side credential injection through an HTTP/HTTPS proxy;
- templates and saved template import/export;
- experimental kits for tools, files, env, credentials, network rules, and commands.

Public source found:

- `docker/sbx-releases`: public release metadata for the `sbx` binary.
- `docker/sbx-kits-contrib`: public kit examples, specs, tests, and helper code.
- `docker/docs`: public documentation source for Sandboxes docs.

Public source not found in this pass:

- Dockerfiles or build source for the published `docker/sandbox-templates`
  image variants. The comparison therefore uses public documentation and Docker
  Hub metadata for image-template behavior.

### `box`

The local repository provides:

- public Dockerfiles and installation scripts for Ubuntu 24.04 images;
- non-root `box` user;
- broad language/runtime coverage;
- theorem prover images;
- Playwright/Puppeteer browser dependency layer in the JS base;
- per-language modular images;
- full image assembled with multi-stage `COPY --from`;
- `dind-box` variants with Docker Engine, Buildx, Compose, and containerd;
- `DIND_DATA_ROOT`, storage-driver, log, wait, and daemon-skip runtime knobs;
- Docker Hub and GHCR publication;
- native amd64/arm64 build requirements and docs-only CI skip behavior.

## Missing Best Practices And Solution Plans

| Priority | Best practice from Docker Sandboxes | `box` gap | Solution plan |
|---|---|---|---|
| P0 | MicroVM isolation for untrusted work. | `box` is a container image and does not itself provide a hypervisor boundary. | Add a hardened runtime guide and evaluate Sysbox, Kata Containers, Firecracker, Cloud Hypervisor, Lima/Colima, QEMU, and gVisor tradeoffs. |
| P0 | Deny-by-default outbound network policy. | `box` has no egress policy store, allowlist, or network log. | Start with docs for `--network none`, internal Docker networks, and allowlisted proxies. Then design an optional launcher with policy files and logs. |
| P0 | Host-side credential proxying. | Secrets are passed manually through env, files, CLI state, or mounts. | Document safe credential flows first: SSH agent, Git credential helpers, Docker secrets, OS keychains, 1Password/pass/SOPS. Add a proxy only after a non-AI use case is clear. |
| P1 | Branch/worktree mode. | Users manage branches, worktrees, mounts, and cleanup manually. | Add a documented script or CLI wrapper that creates a Git worktree, runs `box`, and removes the disposable workspace. |
| P1 | Workspace trust checklist. | No dedicated docs for reviewing sandbox-modified hooks, CI files, build files, `.env`, IDE configs, or executables. | Add a security section to docs with review commands and risk examples. |
| P1 | Templates and declarative kits. | `box` supports Dockerfile extension but has no reusable feature/catalog layer. | Evaluate Dev Container Features, OCI artifacts, and a simple non-AI feature spec before inventing a new format. |
| P1 | DIND storage and resource governance. | `dind-box` has runtime knobs but lacks user-facing size/resource recipes. | Document `DIND_DATA_ROOT`, named Docker volumes, `--cpus`, `--memory`, `--pids-limit`, cleanup, and BuildKit cache options. |
| P1 | Port forwarding workflow. | Docker `-p` exists, but no `box`-specific post-start helper or convention. | Add Docker CLI and Compose examples; consider a launcher if lifecycle helpers are added. |
| P2 | Template snapshot import/export. | Docker supports `commit`/`save`/`load`, but no `box` workflow explains when this is appropriate. | Recommend Dockerfiles for reproducibility; document snapshots only for experiments. |
| P2 | Supply-chain metadata. | Public build source exists, but SBOM/provenance/scanning artifacts are not documented as a release output. | Evaluate Syft, Trivy, Grype, Docker Scout, cosign, SLSA, and in-toto for CI artifacts. |

## Known Components And Libraries To Evaluate

| Problem area | Existing components |
|---|---|
| MicroVM or stronger container isolation | Kata Containers, Firecracker, Cloud Hypervisor, QEMU, Lima, Colima, Sysbox, gVisor. |
| Docker-in-Docker safety | Sysbox, rootless Docker, Docker official `docker:dind`, fuse-overlayfs, BuildKit rootless mode. |
| Network policy and logging | Docker internal networks, Docker `--network none`, nftables, iptables, Cilium, Envoy, mitmproxy, Squid, tinyproxy, Open Policy Agent. |
| Secret and credential handling | Docker secrets, SSH agent forwarding, Git credential helpers, 1Password CLI, pass/gopass, SOPS, OS keychains. |
| Workspace lifecycle | Git worktree, Docker Compose, Dev Containers CLI/spec, Dagger, Make scripts. |
| Reusable environment features | Dev Container Features, OCI artifacts, Dockerfiles, Docker Compose profiles, Nix flakes, mise. |
| Supply-chain evidence | Syft, Grype, Trivy, Docker Scout, cosign, SLSA, in-toto. |
| Policy/spec validation | JSON Schema, CUE, Open Policy Agent/Rego, YAML schema validation. |

## Why `box` Should Not Copy AI-Specific Features

Docker Sandboxes includes built-in agent integrations for tools such as Claude
Code, Codex, Copilot, Gemini, OpenCode, Kiro, Droid, and Docker Agent. Those are
useful for Docker Sandboxes' product goal, but they are not requirements for
`box`. Adding those tools to the base image would make `box` heavier, less
universal, and more coupled to fast-changing AI products.

The reusable non-AI pattern is different: keep `box` as a public universal base
and let downstream images or future feature catalogs add agent-specific tools
when needed.

## Recommended Roadmap

1. Add documentation for secure `box` run profiles: minimal mounts, no host
   Docker socket, optional Sysbox runtime, DIND storage volumes, resource
   limits, and cleanup.
2. Add workspace trust guidance for disposable development boxes.
3. Prototype a small branch/worktree launcher in `experiments/` before adding
   it as supported tooling.
4. Evaluate Dev Container Features or OCI artifacts as a non-AI feature system.
5. Add supply-chain metadata planning for SBOM, scanning, and provenance.
6. Revisit microVM-backed execution after the container-only workflow is fully
   documented, because image source and runtime isolation are separate concerns.

## Validation

The requested docs were absent before this PR:

```bash
test -s docs/docker-sandboxes-comparison.md && test -s docs/case-studies/issue-86/CASE-STUDY.md
```

That command exited with status 1 before the docs were added. After this PR it
passes.

Validation run for this PR:

```bash
test -s docs/docker-sandboxes-comparison.md && test -s docs/case-studies/issue-86/CASE-STUDY.md && test -s docs/case-studies/issue-86/DATA-COLLECTION.md && test -s docs/case-studies/issue-86/issue.md
node -e "for (const f of ['docs/case-studies/issue-86/data/docker-sandbox-templates-tags.json','docs/case-studies/issue-86/data/konard-box-latest-tag.json','docs/case-studies/issue-86/data/konard-box-dind-latest-tag.json','docs/case-studies/issue-86/data/docker-sbx-releases.json','docs/case-studies/issue-86/data/docker-sbx-kits-contrib.json','docs/case-studies/issue-86/data/issue-86.json']) JSON.parse(require('fs').readFileSync(f,'utf8'));"
node -e "const fs=require('fs'), path=require('path'); const files=['docs/docker-sandboxes-comparison.md','docs/case-studies/issue-86/CASE-STUDY.md','docs/case-studies/issue-86/DATA-COLLECTION.md','docs/case-studies/issue-86/issue.md']; let bad=[]; for (const f of files) { const text=fs.readFileSync(f,'utf8'); for (const m of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) { const href=m[1].split('#')[0]; if (!href || /^[a-z]+:/i.test(href) || href.startsWith('mailto:')) continue; const p=path.resolve(path.dirname(f), href); if (!fs.existsSync(p)) bad.push(`${f}: ${m[1]}`); } } if (bad.length) { console.error(bad.join('\n')); process.exit(1); }"
git diff --check
```
