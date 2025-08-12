FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        build-essential \
        pkg-config \
        python3 \
        python3-pip \
        openssl \
        libssl-dev \
        ca-certificates \
        curl \
        git \
        unzip \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Switch to vscode user
USER vscode

# Install mise
RUN curl https://mise.run | sh
ENV PATH="/home/vscode/.local/bin:$PATH"

# Copy mise configuration
COPY --chown=vscode:vscode mise.toml /workspaces/epicenter/mise.toml

# Set working directory
WORKDIR /workspaces/epicenter

# Install tools via mise (this will use the mise.toml from the repo)
RUN mise install

# Ensure mise shims are in PATH and shells auto-activate
RUN echo 'export PATH="$HOME/.local/share/mise/shims:$PATH"' >> ~/.bashrc \
    && echo 'eval "$(mise activate bash)"' >> ~/.bashrc

# Verify installations
RUN mise doctor || true
RUN mise list || true

# Set environment variables for mise
ENV PATH="/home/vscode/.local/share/mise/shims:$PATH"