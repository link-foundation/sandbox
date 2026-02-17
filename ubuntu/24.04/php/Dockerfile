ARG ESSENTIALS_IMAGE=konard/sandbox-essentials:latest
FROM ${ESSENTIALS_IMAGE}
# Build: docker build -f ubuntu/24.04/php/Dockerfile --build-arg ESSENTIALS_IMAGE=sandbox-essentials -t sandbox-php .

# PHP sandbox: PHP 8.3 via Ubuntu packages (fast) or Homebrew (fallback)
# Built on top of essentials-sandbox (inherits JS, git, gh, glab, dev libraries)
#
# Issue #44: Changed from Homebrew-only to apt-first approach
# - apt packages install in ~30 seconds
# - Homebrew can take 2+ hours if bottles unavailable

# Install PHP as root via apt (preferred fast method)
USER root

# Copy scripts
COPY --chown=sandbox:sandbox ubuntu/24.04/common.sh /tmp/common.sh
COPY --chown=sandbox:sandbox ubuntu/24.04/php/install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh /tmp/common.sh

# Try apt installation first (as root)
RUN apt-get update -y && \
    apt-get install -y \
      php8.3-cli php8.3-common php8.3-curl php8.3-mbstring \
      php8.3-xml php8.3-zip php8.3-bcmath php8.3-opcache && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    echo "[✓] PHP installed via apt packages"

# Verify PHP installation
RUN php --version && \
    echo "[✓] PHP verification passed"

# Switch to sandbox user
USER sandbox
WORKDIR /home/sandbox

# Add PHP configuration to bashrc
RUN echo '' >> ~/.bashrc && \
    echo '# PHP configuration (installed via apt)' >> ~/.bashrc && \
    echo "alias php-version='php --version'" >> ~/.bashrc

# Cleanup
USER root
RUN rm -f /tmp/install.sh /tmp/common.sh
USER sandbox

# Set PATH for PHP (covers both apt and Homebrew installations)
# apt installs to /usr/bin, Homebrew to /home/linuxbrew/.linuxbrew/opt/php@8.3/bin
ENV PATH="/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/linuxbrew/.linuxbrew/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
