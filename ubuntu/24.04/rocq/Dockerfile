ARG ESSENTIALS_IMAGE=konard/sandbox-essentials:latest
FROM ${ESSENTIALS_IMAGE}
# Build: docker build -f ubuntu/24.04/rocq/Dockerfile --build-arg ESSENTIALS_IMAGE=sandbox-essentials -t sandbox-rocq .

# Rocq/Coq sandbox: Opam + Rocq theorem prover
# Built on top of essentials-sandbox (inherits JS, git, gh, glab, dev libraries)

USER root
RUN apt-get update -y && apt-get install -y bubblewrap && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER sandbox

COPY --chown=sandbox:sandbox ubuntu/24.04/common.sh /tmp/common.sh
COPY --chown=sandbox:sandbox ubuntu/24.04/rocq/install.sh /tmp/install.sh
RUN chmod +x /tmp/install.sh /tmp/common.sh && \
    bash /tmp/install.sh && \
    rm -f /tmp/install.sh /tmp/common.sh

WORKDIR /home/sandbox

ENV OPAM_SWITCH_PREFIX="/home/sandbox/.opam/default"
ENV CAML_LD_LIBRARY_PATH="/home/sandbox/.opam/default/lib/stublibs:/home/sandbox/.opam/default/lib/ocaml/stublibs:/home/sandbox/.opam/default/lib/ocaml"
ENV OCAML_TOPLEVEL_PATH="/home/sandbox/.opam/default/lib/toplevel"
ENV PATH="/home/sandbox/.opam/default/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
