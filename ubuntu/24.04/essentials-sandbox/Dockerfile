FROM ubuntu:24.04

# Essentials Sandbox Docker image
# Contains minimal tooling for gh-setup-git-identity and glab-setup-git-identity
# Includes: git, gh, glab, bun, deno, nvm/node, npm
# Published as: konard/sandbox-essentials
#
# Build from repository root:
#   docker build -f ubuntu/24.04/essentials-sandbox/Dockerfile -t sandbox-essentials .

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Copy install scripts from repo root context
COPY ubuntu/24.04/common.sh /tmp/common.sh
COPY ubuntu/24.04/essentials-sandbox/install.sh /tmp/install.sh
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /tmp/install.sh /tmp/common.sh /usr/local/bin/entrypoint.sh && \
    DOCKER_BUILD=1 bash /tmp/install.sh && \
    rm -f /tmp/install.sh /tmp/common.sh

USER sandbox
WORKDIR /home/sandbox

# Environment variables for JS runtimes
ENV NVM_DIR="/home/sandbox/.nvm"
ENV BUN_INSTALL="/home/sandbox/.bun"
ENV DENO_INSTALL="/home/sandbox/.deno"
ENV PATH="/home/sandbox/.deno/bin:/home/sandbox/.bun/bin:${PATH}"

SHELL ["/bin/bash", "-c"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
