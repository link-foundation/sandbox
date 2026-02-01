FROM ubuntu:24.04
# Build: docker build -f ubuntu/24.04/assembly/Dockerfile -t sandbox-assembly .

# Assembly sandbox: NASM, FASM (x86_64 only), GNU Assembler, LLVM MC

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

COPY ubuntu/24.04/assembly/install.sh /tmp/install.sh
COPY ubuntu/24.04/common.sh /common.sh
RUN chmod +x /tmp/install.sh && \
    bash /tmp/install.sh && \
    rm -f /tmp/install.sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER sandbox
WORKDIR /home/sandbox

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
