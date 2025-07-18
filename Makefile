# VeriChain Makefile - Build and Development Tools
.PHONY: help full-setup check-deps install-deps download-model build deploy clean clean-model verify start stop dev test
.PHONY: docker-build docker-dev docker-stop docker-clean upload-model test-performance integration-test
.PHONY: qa-suite status health logs update package
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "🔧 VeriChain Build System"
	@echo "========================="
	@echo ""
	@echo "🚀 NEW TO THIS PROJECT? START HERE:"
	@echo "   make full-setup          # Complete automated setup (RECOMMENDED)"
	@echo ""
	@echo "🔄 ALREADY SET UP? USE:"
	@echo "   make dev                 # Start development environment"
	@echo ""
	@echo "🤔 COMMAND GUIDE:"
	@echo "   full-setup = Complete first-time setup (all dependencies + model + build + deploy)"
	@echo "   dev        = Daily development workflow (start DFX + deploy canisters)"
	@echo "   build      = Build project components only"
	@echo "   test       = Run comprehensive test suite"
	@echo "   clean      = Remove all build artifacts and reset environment"
	@echo ""
	@echo "📋 ALL AVAILABLE COMMANDS:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# MAIN SETUP - Choose one based on your situation
# =============================================================================

full-setup: ## 🚀 Complete automated setup (new users - downloads model, builds everything)
	@echo "🚀 VeriChain Complete Setup"
	@echo "============================"
	@echo "This performs EVERYTHING needed for a fresh installation:"
	@echo "• ✅ Check system dependencies"
	@echo "• 📦 Install project dependencies"
	@echo "• 📥 Download ONNX model from Hugging Face (~327MB)"
	@echo "• ✂️  Convert model to chunks for ICP deployment"
	@echo "• 🔨 Build all project components"
	@echo "• 🚀 Start local Internet Computer network"
	@echo "• 🏗️  Deploy canisters"
	@echo "• 📤 Upload model to AI canister"
	@echo ""
	@read -p "Continue with full setup? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@$(MAKE) check-deps
	@$(MAKE) install-deps
	@$(MAKE) clean-model
	@$(MAKE) download-model
	@$(MAKE) start
	@$(MAKE) deploy
	@$(MAKE) build
	@$(MAKE) upload-model
	@echo ""
	@echo "🎉 SETUP COMPLETE!"
	@echo "✅ VeriChain is fully ready to use!"
	@echo "🌐 Frontend: http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/"
	@echo "🔧 Candid UI: http://127.0.0.1:4943/?canisterId=$$(dfx canister id __Candid_UI)"
	@echo "💡 Next time just use 'make dev' to start development"

# =============================================================================
# DEPENDENCY MANAGEMENT
# =============================================================================

check-deps: ## 🔍 Check system dependencies
	@echo "🔍 Checking system dependencies..."
	@echo "Node.js: $$(node --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "NPM: $$(npm --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "Rust: $$(rustc --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "Cargo: $$(cargo --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "DFX: $$(dfx --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "Python3: $$(python3 --version 2>/dev/null || echo '❌ NOT INSTALLED')"
	@echo "Curl: $$(curl --version 2>/dev/null | head -1 || echo '❌ NOT INSTALLED')"
	@echo ""
	@echo "⚠️  Please ensure all dependencies above are installed!"
	@echo "📖 Installation guide: https://internetcomputer.org/docs/current/developer-docs/setup/install/"

install-deps: ## 📦 Install project dependencies
	@echo "📦 Installing project dependencies..."
	@chmod +x scripts/*.sh
	@echo "  🦀 Installing Rust dependencies..."
	@cargo build --release --quiet
	@echo "  🌐 Installing Frontend dependencies (NPM workspace)..."
	@npm install --silent
	@echo "✅ Dependencies installed successfully!"

download-model: ## 📥 Download and convert ONNX model
	@echo "📥 Downloading and converting ONNX model..."
	@if [ -f "src/ai_canister/assets/model_metadata.json" ]; then \
		echo "⚠️  Model already exists. Remove with 'make clean-model' first if you want to re-download."; \
		exit 0; \
	fi
	@echo "🔄 Setting up model files..."
	@./scripts/model-setup.sh
	@echo "✅ Model ready!"

# =============================================================================
# BUILD SYSTEM
# =============================================================================

build: ## 🔨 Build all components for production
	@echo "🔨 Building for production..."
	@./scripts/build.sh --production
	@echo "✅ Build completed."

# =============================================================================
# DEVELOPMENT ENVIRONMENT
# =============================================================================

start: ## 🟢 Start DFX replica in background
	@echo "🟢 Starting DFX replica..."
	@if dfx ping local >/dev/null 2>&1; then \
		echo "✅ DFX replica is already running."; \
	else \
		dfx start --background --clean; \
		echo "✅ DFX replica started."; \
	fi

stop: ## 🔴 Stop DFX replica
	@echo "🔴 Stopping DFX replica..."
	@dfx stop
	@echo "✅ DFX replica stopped."

deploy: ## 🚀 Deploy canisters to local network
	@echo "🚀 Deploying canisters..."
	@if ! dfx canister id ai_canister >/dev/null 2>&1; then \
		echo "🏗️  Creating canisters first..."; \
		dfx canister create --all; \
	fi
	@dfx deploy
	@echo "✅ Deployment completed."

dev: ## 🎮 Start development environment (assumes setup is done)
	@echo "🎮 Starting development environment..."
	@$(MAKE) start
	@$(MAKE) deploy
	@echo "🎉 Development environment ready!"
	@echo "🌐 Frontend: http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/"
	@echo "🔧 Candid UI: http://127.0.0.1:4943/?canisterId=$$(dfx canister id __Candid_UI)"

# =============================================================================
# TESTING
# =============================================================================

test: ## 🧪 Run all tests
	@echo "🧪 Running tests..."
	@cargo test
	@cd src/frontend && npm test
	@dfx canister call ai_canister health_check
	@echo "✅ All tests completed."

test-performance: ## ⚡ Run performance tests
	@echo "⚡ Running performance tests..."
	@./scripts/test-performance-advanced.sh
	@echo "✅ Performance testing completed."

integration-test: ## 🎯 Run comprehensive integration test
	@echo "🎯 Running final integration test..."
	@./scripts/final-integration-test.sh
	@echo "✅ Integration testing completed."

qa-suite: test-performance integration-test ## 🏆 Run complete QA test suite
	@echo "🏆 All QA tests completed successfully!"

# =============================================================================
# MODEL OPERATIONS
# =============================================================================

upload-model: ## 📤 Upload model chunks to AI canister
	@echo "📤 Uploading model to canister..."
	@./scripts/upload-model.sh
	@echo "✅ Model upload completed."

# =============================================================================
# MAINTENANCE
# =============================================================================

clean: ## 🧹 Clean all build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@cargo clean
	@rm -rf .dfx target
	@rm -rf src/frontend/dist node_modules
	@echo "✅ Cleanup completed."

clean-model: ## 🗑️ Remove downloaded model files only
	@echo "🗑️ Removing model files..."
	@rm -rf src/ai_canister/assets/
	@echo "✅ Model files removed."

verify: ## ✅ Verify project setup is complete
	@echo "✅ Verifying VeriChain setup..."
	@echo "🔍 Checking components:"
	@echo -n "  📦 Rust dependencies: "; [ -f "target/wasm32-unknown-unknown/release/ai_canister.wasm" ] && echo "✅" || echo "❌ Run 'make install-deps'"
	@echo -n "  🌐 Frontend dependencies: "; [ -d "node_modules" ] && echo "✅" || echo "❌ Run 'make install-deps'"
	@echo -n "  🤖 Model files: "; [ -f "src/ai_canister/assets/model_metadata.json" ] && echo "✅" || echo "❌ Run 'make download-model'"
	@echo -n "  🔨 Frontend build: "; [ -d "src/frontend/dist" ] && echo "✅" || echo "❌ Run 'make build'"
	@echo -n "  🟢 DFX running: "; dfx ping local >/dev/null 2>&1 && echo "✅" || echo "❌ Run 'make start'"
	@echo -n "  🚀 Canisters deployed: "; dfx canister id ai_canister >/dev/null 2>&1 && echo "✅" || echo "❌ Run 'make deploy'"
	@echo ""
	@if [ -f "target/wasm32-unknown-unknown/release/ai_canister.wasm" ] && [ -d "node_modules" ] && [ -f "src/ai_canister/assets/model_metadata.json" ] && [ -d "src/frontend/dist" ] && dfx ping local >/dev/null 2>&1 && dfx canister id ai_canister >/dev/null 2>&1; then \
		echo "🎉 VeriChain is fully set up and ready!"; \
		echo "🌐 Frontend: http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/"; \
	else \
		echo "⚠️  Setup incomplete. Run 'make full-setup' to complete."; \
	fi

status: ## 📊 Show project status
	@echo "📊 VeriChain Project Status"
	@echo "=========================="
	@echo "DFX Status: $$(dfx ping local 2>/dev/null && echo 'Running' || echo 'Stopped')"
	@echo "Frontend built: $$([ -d src/frontend/dist ] && echo 'Yes' || echo 'No')"
	@echo "Model present: $$([ -f src/ai_canister/assets/model_metadata.json ] && echo 'Yes' || echo 'No')"
	@echo "Canisters: $$(dfx canister status ai_canister 2>/dev/null | grep Status || echo 'Not deployed')"

health: ## 🏥 Quick health check of all components
	@echo "🏥 VeriChain Health Check"
	@echo "========================"
	@echo -n "🟢 DFX: "; dfx ping local >/dev/null 2>&1 && echo "Healthy" || echo "❌ Down"
	@echo -n "🤖 AI Canister: "; dfx canister call ai_canister health_check 2>/dev/null >/dev/null && echo "Healthy" || echo "❌ Unhealthy"
	@echo -n "🔧 Logic Canister: "; dfx canister status logic_canister >/dev/null 2>&1 && echo "Healthy" || echo "❌ Down"

logs: ## 📋 Show canister logs
	@echo "📋 Showing recent canister logs..."
	@dfx canister logs ai_canister || echo "No logs available"

update: ## ⬆️ Update all dependencies
	@echo "⬆️ Updating dependencies..."
	@cargo update
	@npm update
	@echo "✅ Dependencies updated."

# =============================================================================
# DOCKER SUPPORT (Optional)
# =============================================================================

docker-build: ## 🐳 Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t verichain:latest .
	@echo "✅ Docker image built."

docker-dev: ## � Start with Docker
	@echo "🐳 Starting Docker development environment..."
	@docker-compose up --build -d
	@echo "✅ Docker environment started at http://localhost:3000"

docker-stop: ## 🐳 Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down
	@echo "✅ Docker containers stopped."

package: build ## 📦 Create distribution package
	@echo "📦 Creating distribution package..."
	@tar -czf verichain-dist.tar.gz src/frontend/dist .dfx/local/canisters
	@echo "✅ Package created: verichain-dist.tar.gz"
