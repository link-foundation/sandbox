ARG ESSENTIALS_IMAGE=konard/sandbox-essentials:latest
FROM ${ESSENTIALS_IMAGE}
# Build: docker build -f ubuntu/24.04/php/Dockerfile --build-arg ESSENTIALS_IMAGE=sandbox-essentials -t sandbox-php .

# PHP sandbox: PHP 8.3 via Ubuntu packages (fast) or Homebrew (fallback)
# Built on top of essentials-sandbox (inherits JS, git, gh, glab, dev libraries)
#
# Issue #44: Changed from Homebrew-only to apt-first approach
# - apt packages install in ~30 seconds
# - Homebrew can take 2+ hours if bottles unavailable

# Install PHP as root (needed for apt)
USER root

# Copy and run install script
COPY --chown=sandbox:sandbox ubuntu/24.04/common.sh /tmp/common.sh
COPY --chown=sandbox:sandbox ubuntu/24.04/php/install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh /tmp/common.sh && \
    bash /tmp/install.sh && \
    rm -f /tmp/install.sh /tmp/common.sh

# Switch back to sandbox user
USER sandbox
WORKDIR /home/sandbox

# Set PATH for PHP (covers both apt and Homebrew installations)
# apt installs to /usr/bin, Homebrew to /home/linuxbrew/.linuxbrew/opt/php@8.3/bin
ENV PATH="/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/linuxbrew/.linuxbrew/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
