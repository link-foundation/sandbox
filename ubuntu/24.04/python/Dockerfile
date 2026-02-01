FROM ubuntu:24.04
# Build: docker build -f ubuntu/24.04/python/Dockerfile -t sandbox-python .

# Python sandbox: Pyenv + latest stable Python

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

# Install system prerequisites and Python build dependencies
RUN apt update -y && \
    apt install -y curl git sudo ca-certificates build-essential \
    libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev \
    libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
    libffi-dev liblzma-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash sandbox && \
    passwd -d sandbox && \
    usermod -aG sudo sandbox

COPY ubuntu/24.04/python/install.sh /tmp/install.sh
COPY ubuntu/24.04/common.sh /common.sh
RUN chmod +x /tmp/install.sh && \
    su - sandbox -c "bash /tmp/install.sh" && \
    rm -f /tmp/install.sh

USER sandbox
WORKDIR /home/sandbox

ENV PYENV_ROOT="/home/sandbox/.pyenv"
ENV PATH="/home/sandbox/.pyenv/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
