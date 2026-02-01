ARG ESSENTIALS_IMAGE=konard/sandbox-essentials:latest
FROM ${ESSENTIALS_IMAGE}

# Full Sandbox environment Docker image
# Contains all language runtimes and development tools.
# This is the "full-sandbox" image (konard/sandbox or konard/sandbox-full).
#
# Architecture: JS sandbox → essentials-sandbox → full-sandbox (this image)
#
# For a lighter image with just essentials, see ubuntu/24.04/essentials-sandbox/Dockerfile.
# For just JavaScript, see ubuntu/24.04/js/Dockerfile.
# For individual language images, see ubuntu/24.04/<language>/Dockerfile.
#
# Build from repository root:
#   docker build -t sandbox .
#
# Build with specific essentials image:
#   docker build --build-arg ESSENTIALS_IMAGE=konard/sandbox-essentials:latest -t sandbox .

USER root

# Set non-interactive frontend for apt
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /workspace

# Copy the modular installation scripts
COPY ubuntu/24.04/common.sh /tmp/sandbox-scripts/common.sh
COPY ubuntu/24.04/full-sandbox/install.sh /tmp/sandbox-scripts/full-sandbox/install.sh

# Copy entrypoint script for proper environment initialization
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

# Make scripts executable and run the full installation
# Pass DOCKER_BUILD=1 environment variable to indicate Docker build environment
RUN chmod +x /tmp/sandbox-scripts/full-sandbox/install.sh && \
    chmod +x /tmp/sandbox-scripts/common.sh && \
    chmod +x /usr/local/bin/entrypoint.sh && \
    DOCKER_BUILD=1 bash /tmp/sandbox-scripts/full-sandbox/install.sh && \
    rm -rf /tmp/sandbox-scripts

# Switch to sandbox user
USER sandbox

# Set home directory
WORKDIR /home/sandbox

# Set up basic environment variables (tools will be fully loaded by entrypoint)
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

# Set up PATH for tools that don't need special initialization
# Bun, Deno, Cargo, elan, rbenv, Swift, Homebrew work with just PATH
ENV PATH="/home/sandbox/.rbenv/bin:/home/sandbox/.rbenv/shims:/home/sandbox/.swift/usr/bin:/home/sandbox/.elan/bin:/home/sandbox/.opam/default/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/sandbox/.cargo/bin:/home/sandbox/.deno/bin:/home/sandbox/.bun/bin:/home/sandbox/.go/bin:/home/sandbox/.go/path/bin:/home/linuxbrew/.linuxbrew/bin:${PATH}"

# Opam environment variables for Rocq/Coq theorem prover
ENV OPAM_SWITCH_PREFIX="/home/sandbox/.opam/default"
ENV CAML_LD_LIBRARY_PATH="/home/sandbox/.opam/default/lib/stublibs:/home/sandbox/.opam/default/lib/ocaml/stublibs:/home/sandbox/.opam/default/lib/ocaml"
ENV OCAML_TOPLEVEL_PATH="/home/sandbox/.opam/default/lib/toplevel"

# Use bash as default shell
SHELL ["/bin/bash", "-c"]

# Use entrypoint to initialize environment
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Set default command to bash
CMD ["/bin/bash"]
