FROM ubuntu:24.04

# Sandbox environment Docker image
# Contains common language runtimes without any AI-specific tools
# This image is meant to be used as a base for other projects that need language runtimes.

# Set non-interactive frontend for apt
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /workspace

# Copy the installation script
COPY scripts/ubuntu-24-server-install.sh /tmp/ubuntu-24-server-install.sh

# Make the script executable and run it
# Pass DOCKER_BUILD=1 environment variable to indicate Docker build environment
RUN chmod +x /tmp/ubuntu-24-server-install.sh && \
    DOCKER_BUILD=1 bash /tmp/ubuntu-24-server-install.sh && \
    rm -f /tmp/ubuntu-24-server-install.sh

# Switch to sandbox user
USER sandbox

# Set home directory
WORKDIR /home/sandbox

# Set up environment variables for all the tools installed by the script
ENV NVM_DIR="/home/sandbox/.nvm"
ENV PYENV_ROOT="/home/sandbox/.pyenv"
ENV BUN_INSTALL="/home/sandbox/.bun"
ENV DENO_INSTALL="/home/sandbox/.deno"
ENV CARGO_HOME="/home/sandbox/.cargo"
# Include PHP paths from Homebrew (PHP is keg-only and needs explicit PATH entry)
# Include Cargo/Rust paths (installed via rustup)
# Include Lean/elan paths
# Include Opam paths for Rocq/Coq theorem prover
ENV PATH="/home/sandbox/.elan/bin:/home/sandbox/.opam/default/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/sandbox/.cargo/bin:/home/sandbox/.deno/bin:/home/sandbox/.bun/bin:/home/sandbox/.pyenv/bin:/home/sandbox/.nvm/versions/node/v20.*/bin:/home/linuxbrew/.linuxbrew/bin:${PATH}"
# Opam environment variables for Rocq/Coq theorem prover
ENV OPAM_SWITCH_PREFIX="/home/sandbox/.opam/default"
ENV CAML_LD_LIBRARY_PATH="/home/sandbox/.opam/default/lib/stublibs:/home/sandbox/.opam/default/lib/ocaml/stublibs:/home/sandbox/.opam/default/lib/ocaml"
ENV OCAML_TOPLEVEL_PATH="/home/sandbox/.opam/default/lib/toplevel"

# Load NVM, Pyenv, and other tools in shell sessions
SHELL ["/bin/bash", "-c"]

# Set default command to bash
CMD ["/bin/bash"]
