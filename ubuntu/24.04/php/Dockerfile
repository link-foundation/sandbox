FROM ubuntu:24.04

# PHP sandbox: PHP 8.3 via Homebrew

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox && \
    mkdir -p /home/linuxbrew/.linuxbrew && \
    chown -R sandbox:sandbox /home/linuxbrew

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh && \
    su - sandbox -c "bash /tmp/install.sh" && \
    rm -f /tmp/install.sh

USER sandbox
WORKDIR /home/sandbox

ENV PATH="/home/linuxbrew/.linuxbrew/opt/php@8.3/bin:/home/linuxbrew/.linuxbrew/opt/php@8.3/sbin:/home/linuxbrew/.linuxbrew/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
