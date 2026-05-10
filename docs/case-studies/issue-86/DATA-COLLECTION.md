# Data Collection: Issue #86

Evidence date: 2026-05-10 UTC.

This folder preserves the local evidence and external metadata used to compare
Docker Sandboxes with `box`. Full upstream documentation pages were not copied
into this repository; the case study links to the public pages and stores the
commands plus compact metadata snapshots needed to reproduce the analysis.

## Preserved Files

| File | Purpose |
|---|---|
| [`issue.md`](./issue.md) | Human-readable issue snapshot. |
| [`data/issue-86.json`](./data/issue-86.json) | GitHub issue JSON with title, body, URL, timestamps, and comments. |
| [`data/docker-sandbox-templates-tags.json`](./data/docker-sandbox-templates-tags.json) | Docker Hub tag metadata for `docker/sandbox-templates`. |
| [`data/konard-box-latest-tag.json`](./data/konard-box-latest-tag.json) | Docker Hub tag metadata for `konard/box:latest`. |
| [`data/konard-box-dind-latest-tag.json`](./data/konard-box-dind-latest-tag.json) | Docker Hub tag metadata for `konard/box-dind:latest`. |
| [`data/docker-sbx-releases.json`](./data/docker-sbx-releases.json) | GitHub repository metadata for `docker/sbx-releases`. |
| [`data/docker-sbx-releases-list.txt`](./data/docker-sbx-releases-list.txt) | Recent `docker/sbx-releases` release list. |
| [`data/docker-sbx-kits-contrib.json`](./data/docker-sbx-kits-contrib.json) | GitHub repository metadata for `docker/sbx-kits-contrib`. |
| [`data/docker-sbx-kits-contrib-root.txt`](./data/docker-sbx-kits-contrib-root.txt) | Root directory listing for `docker/sbx-kits-contrib`. |
| [`data/docker-code-search-sandbox-templates.txt`](./data/docker-code-search-sandbox-templates.txt) | GitHub code search output for `sandbox-templates` in Docker-owned repositories. |
| [`data/docker-docs-sandboxes-paths.txt`](./data/docker-docs-sandboxes-paths.txt) | Top-level Docker docs paths under `content/manuals/ai/sandboxes`. |

## Commands Used

```bash
gh issue view https://github.com/link-foundation/box/issues/86 --json title,body,comments,url,createdAt,updatedAt
gh api repos/link-foundation/box/issues/86/comments --paginate
gh pr view 87 --repo link-foundation/box --json title,body,isDraft,url,headRefName,baseRefName,commits,statusCheckRollup
gh api repos/link-foundation/box/pulls/87/comments --paginate
gh api repos/link-foundation/box/issues/87/comments --paginate
gh api repos/link-foundation/box/pulls/87/reviews --paginate
gh search code --owner docker 'sandbox-templates' --limit 50
gh search code --owner docker 'DOCKER_SANDBOXES_DOCKER_SIZE' --limit 20
gh repo view docker/sbx-releases --json nameWithOwner,url,description,homepageUrl,updatedAt,licenseInfo,isPrivate
gh release list --repo docker/sbx-releases --limit 20
gh repo view docker/sbx-kits-contrib --json nameWithOwner,url,description,homepageUrl,updatedAt,licenseInfo,isPrivate
gh api repos/docker/sbx-kits-contrib/contents --jq '.[].name'
gh api repos/docker/docs/contents/content/manuals/ai/sandboxes?ref=main --jq '.[].path'
curl -fsSL 'https://hub.docker.com/v2/repositories/docker/sandbox-templates/tags?page_size=100'
curl -fsSL 'https://hub.docker.com/v2/repositories/konard/box/tags/latest'
curl -fsSL 'https://hub.docker.com/v2/repositories/konard/box-dind/tags/latest'
```

## Docker Sandboxes Source Findings

The public evidence found for Docker Sandboxes is split across documentation,
release metadata, template image metadata, and kit source:

| Artifact | Finding |
|---|---|
| `docker/sbx-releases` | Public release repository for `sbx`, with releases such as `v0.28.3` on 2026-04-29 and nightly releases. It did not expose template image Dockerfiles in the files inspected. |
| `docker/sbx-kits-contrib` | Public Apache-2.0 repository containing kit specs, examples, tests, and directories such as `code-server`, `trivy`, `mise`, `task`, and model-runner related kits. |
| `docker/docs` | Public docs contain the product behavior, template names, kit format, security model, policy commands, and Docker storage sizing variable. |
| `docker/sandbox-templates` Docker Hub metadata | Public image tags and manifests exist. Source Dockerfiles for these template images were not found in Docker-owned GitHub code search results during this pass. |

Because public template image source was not found, the comparison treats
Docker's docs and Docker Hub metadata as the authoritative public evidence for
template features.

## Docker Hub Metadata Summary

| Image/tag | Docker Hub reported size | Last updated | Relevant notes |
|---|---:|---|---|
| `docker/sandbox-templates:shell` | 485.8 MiB | 2026-05-09 | Generic no-agent template. |
| `docker/sandbox-templates:shell-docker` | 550.0 MiB | 2026-05-06 | Generic template with Docker Engine inside. |
| `docker/sandbox-templates:codex` | 664.6 MiB | 2026-05-06 | AI-specific, excluded from gaps. |
| `docker/sandbox-templates:codex-docker` | 728.8 MiB | 2026-05-06 | AI-specific, excluded from gaps. |
| `docker/sandbox-templates:opencode-docker` | 964.7 MiB | 2026-05-06 | AI-specific, excluded from gaps. |
| `konard/box:latest` | 5.47 GiB on amd64 | 2026-05-01 | Full universal `box` image. |
| `konard/box-dind:latest` | 5.59 GiB on amd64 | 2026-05-01 | Full universal `box` image plus Docker-in-Docker. |

Docker Hub tag `full_size` is registry-reported compressed image metadata and
should be used only as an approximate comparison point. The `box` full image is
larger because it intentionally includes many language runtimes and tools.

## Local `box` Evidence Read

| Local file | Evidence used |
|---|---|
| [`README.md`](../../../README.md) | Runtime/tool list, modular image matrix, registry links, dind-box description, DIND security notes. |
| [`REQUIREMENTS.md`](../../../REQUIREMENTS.md) | Functional requirements, security requirements, multi-arch requirements, local-first install policy. |
| [`ARCHITECTURE.md`](../../../ARCHITECTURE.md) | Build architecture, multi-stage assembly, native ARM64 policy, modular design. |
| [`Dockerfile`](../../../Dockerfile) and [`ubuntu/24.04/full-box/Dockerfile`](../../../ubuntu/24.04/full-box/Dockerfile) | Full image assembly and system packages. |
| [`ubuntu/24.04/js/Dockerfile`](../../../ubuntu/24.04/js/Dockerfile) | Non-root `box` user and browser automation dependencies. |
| [`ubuntu/24.04/dind/Dockerfile`](../../../ubuntu/24.04/dind/Dockerfile) | DIND layer design and private daemon comments. |
| [`ubuntu/24.04/dind/install.sh`](../../../ubuntu/24.04/dind/install.sh) | Docker Engine, CLI, Buildx, Compose, containerd, and fuse-overlayfs installation. |
| [`ubuntu/24.04/dind/dind-entrypoint.sh`](../../../ubuntu/24.04/dind/dind-entrypoint.sh) | Runtime knobs for `DIND_DATA_ROOT`, storage driver, daemon wait, and user handoff. |

## Official Docker Documentation Links

- Docker Sandboxes product page: https://www.docker.com/products/docker-sandboxes/
- Docker Sandboxes docs: https://docs.docker.com/ai/sandboxes/
- Get started: https://docs.docker.com/ai/sandboxes/get-started/
- Architecture: https://docs.docker.com/ai/sandboxes/architecture/
- Usage: https://docs.docker.com/ai/sandboxes/usage/
- Isolation: https://docs.docker.com/ai/sandboxes/security/isolation/
- Default security posture: https://docs.docker.com/ai/sandboxes/security/defaults/
- Policies: https://docs.docker.com/ai/sandboxes/security/policy/
- Credentials: https://docs.docker.com/ai/sandboxes/security/credentials/
- Workspace trust: https://docs.docker.com/ai/sandboxes/security/workspace/
- Templates: https://docs.docker.com/ai/sandboxes/customize/templates/
- Kits: https://docs.docker.com/ai/sandboxes/customize/kits/
