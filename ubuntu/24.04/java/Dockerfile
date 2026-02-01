FROM ubuntu:24.04

# Java sandbox: SDKMAN + Eclipse Temurin 21 LTS

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates zip unzip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh && \
    su - sandbox -c "bash /tmp/install.sh" && \
    rm -f /tmp/install.sh

USER sandbox
WORKDIR /home/sandbox

ENV SDKMAN_DIR="/home/sandbox/.sdkman"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
