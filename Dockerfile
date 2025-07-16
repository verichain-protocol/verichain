# VeriChain Dockerfile - Minimal Development Environment
FROM ubuntu:22.04

# Prevent interactive installation prompts
ENV DEBIAN_FRONTEND=noninteractive

# Essential system packages only
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add wasm32-unknown-unknown

# Install DFX
RUN sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)" < /dev/null
ENV PATH="/root/.local/share/dfx/bin:${PATH}"

# Set working directory
WORKDIR /workspace

# Copy package files first for better layer caching
COPY package*.json ./
COPY Cargo.toml Cargo.lock ./
COPY src/frontend/package*.json ./src/frontend/

# Install dependencies (separate layer for caching)
RUN npm ci --only=production
RUN cd src/frontend && npm ci --only=production
RUN cargo fetch

# Copy source code
COPY . .

# Make scripts executable and run setup
RUN chmod +x scripts/*.sh

# Expose ports
EXPOSE 4943 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD dfx ping local || exit 1

# Start command
CMD ["make", "dev"]
