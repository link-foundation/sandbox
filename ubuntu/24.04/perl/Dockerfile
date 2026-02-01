FROM ubuntu:24.04

# Perl sandbox: Perlbrew + latest stable Perl

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates build-essential && \
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

ENV PERLBREW_ROOT="/home/sandbox/.perl5"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
