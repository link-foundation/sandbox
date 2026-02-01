ARG ESSENTIALS_IMAGE=konard/sandbox-essentials:latest
FROM ${ESSENTIALS_IMAGE}
# Build: docker build -f ubuntu/24.04/ruby/Dockerfile --build-arg ESSENTIALS_IMAGE=sandbox-essentials -t sandbox-ruby .

# Ruby sandbox: rbenv + latest stable Ruby 3.x
# Built on top of essentials-sandbox (inherits JS, git, gh, glab, dev libraries including libyaml-dev)

USER sandbox

COPY ubuntu/24.04/common.sh /tmp/common.sh
COPY ubuntu/24.04/ruby/install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh /tmp/common.sh && \
    bash /tmp/install.sh && \
    rm -f /tmp/install.sh /tmp/common.sh

WORKDIR /home/sandbox

ENV RBENV_ROOT="/home/sandbox/.rbenv"
ENV PATH="/home/sandbox/.rbenv/bin:/home/sandbox/.rbenv/shims:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
