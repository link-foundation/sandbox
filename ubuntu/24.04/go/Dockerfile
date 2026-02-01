FROM ubuntu:24.04
# Build: docker build -f ubuntu/24.04/go/Dockerfile -t sandbox-go .

# Go sandbox: latest stable Go

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

COPY ubuntu/24.04/go/install.sh /tmp/install.sh
COPY ubuntu/24.04/common.sh /common.sh
RUN chmod +x /tmp/install.sh && \
    su - sandbox -c "bash /tmp/install.sh" && \
    rm -f /tmp/install.sh

USER sandbox
WORKDIR /home/sandbox

ENV GOROOT="/home/sandbox/.go"
ENV GOPATH="/home/sandbox/.go/path"
ENV PATH="/home/sandbox/.go/bin:/home/sandbox/.go/path/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
