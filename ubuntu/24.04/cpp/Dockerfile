FROM ubuntu:24.04

# C/C++ sandbox: build-essential, CMake, Clang, LLVM, LLD

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

COPY install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh && \
    bash /tmp/install.sh && \
    rm -f /tmp/install.sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER sandbox
WORKDIR /home/sandbox

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
