FROM ubuntu:24.04

# Full Sandbox Docker image
# Contains all language runtimes and development tools
# Built on top of essentials-sandbox install script
# Published as: konard/sandbox (or konard/sandbox-full)
#
# Build from repository root:
#   docker build -f ubuntu/24.04/full-sandbox/Dockerfile -t sandbox-full .

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Copy all install scripts from repo root context
COPY ubuntu/24.04/common.sh /tmp/sandbox-scripts/common.sh
COPY ubuntu/24.04/essentials-sandbox/install.sh /tmp/sandbox-scripts/essentials-sandbox/install.sh
COPY ubuntu/24.04/full-sandbox/install.sh /tmp/sandbox-scripts/full-sandbox/install.sh
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

# Make scripts executable and run the full installation
RUN chmod +x /tmp/sandbox-scripts/full-sandbox/install.sh && \
    chmod +x /tmp/sandbox-scripts/common.sh && \
    chmod +x /tmp/sandbox-scripts/essentials-sandbox/install.sh && \
    chmod +x /usr/local/bin/entrypoint.sh && \
    DOCKER_BUILD=1 bash /tmp/sandbox-scripts/full-sandbox/install.sh && \
    rm -rf /tmp/sandbox-scripts

USER sandbox
WORKDIR /home/sandbox

# Environment variables for all tools
ENV NVM_DIR="/home/sandbox/.nvm"
ENV PYENV_ROOT="/home/sandbox/.pyenv"
ENV BUN_INSTALL="/home/sandbox/.bun"
ENV DENO_INSTALL="/home/sandbox/.deno"
ENV CARGO_HOME="/home/sandbox/.cargo"
ENV GOROOT="/home/sandbox/.go"
ENV GOPATH="/home/sandbox/.go/path"
ENV SDKMAN_DIR="/home/sandbox/.sdkman"
ENV PERLBREW_ROOT="/home/sandbox/.perl5"
ENV RBENV_ROOT="/home/sandbox/.rbenv"

# PATH for tools that don't need special initialization
ENV PATH="/home/sandbox/.rbenv/bin:/home/sandbox/.rbenv/shims:/home/sandbox/.swift/usr/bin:/home/sandbox/.elan/bin:/home/sandbox/.opam/default/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/sandbox/.cargo/bin:/home/sandbox/.deno/bin:/home/sandbox/.bun/bin:/home/sandbox/.go/bin:/home/sandbox/.go/path/bin:/home/linuxbrew/.linuxbrew/bin:${PATH}"

# Opam environment variables
ENV OPAM_SWITCH_PREFIX="/home/sandbox/.opam/default"
ENV CAML_LD_LIBRARY_PATH="/home/sandbox/.opam/default/lib/stublibs:/home/sandbox/.opam/default/lib/ocaml/stublibs:/home/sandbox/.opam/default/lib/ocaml"
ENV OCAML_TOPLEVEL_PATH="/home/sandbox/.opam/default/lib/toplevel"

SHELL ["/bin/bash", "-c"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
