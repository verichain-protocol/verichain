# VeriChain: On-Chain Deepfake Detection Platform

VeriChain is a decentralized application built on the Internet Computer that provides a trustless and transparent solution for detecting deepfakes and AI-generated media. By leveraging an on-chain AI model, it offers verifiable analysis for images and videos.

## 🏛️ Architecture

This project is structured as a **monorepo**, containing all necessary services within a single repository for streamlined development and deployment.

-   **`src/frontend/`**: The user-facing web application, built with React. It interacts with the `logic_canister` for all backend operations.
-   **`src/logic_canister/`**: The "application brain," written in Motoko. It handles all business logic, including user authentication (via Internet Identity), usage quotas, API key management, and orchestrates calls to the AI canister.
-   **`src/ai_canister/`**: The "AI engine," written in Rust for maximum performance. This canister is dedicated to running the ONNX model for deepfake detection inference.

This hybrid architecture leverages the strengths of each language: the safety and ease of Motoko for business logic, and the raw performance of Rust for computationally intensive AI tasks.

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Vite
-   **Logic Canister:** Motoko
-   **AI Canister:** Rust
-   **Blockchain:** Internet Computer (ICP)

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine.

### 1. Prerequisites

Ensure you have the following installed:
-   [DFX (ICP SDK)](https://internetcomputer.org/docs/current/developer-docs/setup/install) (version 0.15.0 or later)
-   [Node.js](https://nodejs.org) (version 18.x or later)
-   [Rust & Cargo](https://www.rust-lang.org/tools/install) with the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)
-   [Mops](https://mops.one/) (`npm install -g mops`)

### 2. Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/verichain-protocol/verichain.git
    cd verichain
    ```

2.  **Download the AI Model:**
    The AI canister requires the pre-trained `.onnx` model file.
    -   Download `verichain-model.onnx` from the [Hugging Face Model Hub](https://huggingface.co/einrafh/verichain-deepfake-models/tree/main/models/onnx).
    -   Create a directory `src/ai_canister/assets/`.
    -   Place the downloaded `verichain-model.onnx` file inside this `assets` directory.

3.  **Initialize Motoko Package Manager:**
    This command creates the `mops.toml` configuration file.
    ```bash
    mops init
    ```
    *(When prompted, select `Project` and choose `n` for the GitHub workflow.)*

4.  **Install All Dependencies:**
    This single command will install dependencies for the frontend (`npm`), Motoko (`mops`), and Rust (`cargo`).
    ```bash
    npm install && npx mops init && npx mops add base@0.14.9 && cargo update
    ```

### 3. Running the Application Locally

For local development, it's best to use two separate terminal windows.

**In Terminal 1 - Start the Local Replica:**
This terminal will run the local Internet Computer network. Keep it open to see live log outputs.
```bash
# Start the local replica with a clean state
dfx start --clean
```

**In Terminal 2 - Deploy the Canisters:**
Use this terminal to run all other `dfx` commands.
```bash
# Deploy all canisters to the local network
dfx deploy
```

Once deployed, the terminal will provide you with URLs to access the frontend and the Candid UI for each canister.

## 📄 License

Copyright (c) 2025

-   Muhammad Rafly Ash Shiddiqi
-   Nickolas Quinn Budiyono
-   Christopher Robin Tanugroho
