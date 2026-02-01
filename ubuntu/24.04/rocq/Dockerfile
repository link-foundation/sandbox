FROM ubuntu:24.04

# Rocq/Coq sandbox: Opam + Rocq theorem prover

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /workspace

RUN apt update -y && \
    apt install -y curl git sudo ca-certificates build-essential bubblewrap && \
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

ENV OPAM_SWITCH_PREFIX="/home/sandbox/.opam/default"
ENV CAML_LD_LIBRARY_PATH="/home/sandbox/.opam/default/lib/stublibs:/home/sandbox/.opam/default/lib/ocaml/stublibs:/home/sandbox/.opam/default/lib/ocaml"
ENV OCAML_TOPLEVEL_PATH="/home/sandbox/.opam/default/lib/toplevel"
ENV PATH="/home/sandbox/.opam/default/bin:${PATH}"

SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash"]
