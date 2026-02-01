FROM ubuntu:24.04
# Build: docker build -f ubuntu/24.04/js/Dockerfile -t sandbox-js .

# JavaScript/TypeScript sandbox: Node.js (NVM), Bun, Deno
# Includes: gh-setup-git-identity, glab-setup-git-identity

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Install minimal system prerequisites
RUN apt update -y && \
    apt install -y curl git sudo ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create sandbox user
RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

# Copy and run install script
COPY ubuntu/24.04/js/install.sh /tmp/install.sh
COPY ubuntu/24.04/common.sh /common.sh
RUN chmod +x /tmp/install.sh && \
    su - sandbox -c "bash /tmp/install.sh" && \
    rm -f /tmp/install.sh

USER sandbox
WORKDIR /home/sandbox

ENV NVM_DIR="/home/sandbox/.nvm"
ENV BUN_INSTALL="/home/sandbox/.bun"
ENV DENO_INSTALL="/home/sandbox/.deno"
ENV PATH="/home/sandbox/.deno/bin:/home/sandbox/.bun/bin:${PATH}"

SHELL ["/bin/bash", "-c"]

CMD ["/bin/bash"]
