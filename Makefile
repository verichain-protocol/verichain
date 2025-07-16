# VeriChain Makefile - Build and Development Tools
.PHONY: help setup install model-setup build deploy clean start stop dev all test reset
.PHONY: docker-build docker-dev docker-stop docker-clean
.PHONY: upload-model setup-model-complete stream-init-demo test-performance test-error-recovery integration-test test-social-media
.PHONY: full-setup qa-suite
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "🔧 VeriChain Build System"
	@echo "========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Main commands
setup: ## Complete project setup (dependencies + model + build)
	@echo "🚀 VeriChain Complete Setup Starting..."
	@chmod +x scripts/*.sh
	@echo "📦 Installing system dependencies..."
	@which dfx > /dev/null || (echo "Error: DFX not found. Install from https://internetcomputer.org/docs/current/developer-docs/setup/install/" && exit 1)
	@which rust > /dev/null || (echo "Error: Rust not found. Install from https://rustup.rs/" && exit 1)
	@which node > /dev/null || (echo "Error: Node.js not found. Install Node.js ≥16.0.0" && exit 1)
	@echo "📦 Installing Rust dependencies..."
	@cargo build --release --quiet
	@echo "📦 Installing Frontend dependencies..."
	@cd src/frontend && npm ci --silent
	@echo "🤖 Setting up AI model (this may take a few minutes)..."
	@./scripts/model-setup.sh
	@echo "🔨 Building all components..."
	@./scripts/build.sh --production
	@echo "✅ Setup completed! Run 'make dev' to start development."

install: ## Install dependencies only
	@echo "📦 Installing dependencies..."
	@chmod +x scripts/*.sh
	@cargo build --quiet
	@cd src/frontend && npm ci --silent
	@echo "✅ Dependencies installed."

model-setup: ## Download and chunk AI model from Hugging Face
	@echo "🤖 Setting up AI model..."
	@./scripts/model-setup.sh
	@echo "✅ Model setup completed."

build: ## Build all components for production
	@echo "🔨 Building for production..."
	@./scripts/build.sh --production
	@echo "✅ Build completed."

dev-build: ## Build for development (faster)
	@echo "🔨 Building for development..."
	@./scripts/build.sh
	@echo "✅ Development build completed."

# Development environment
start: ## Start DFX replica in background
	@echo "🟢 Starting DFX replica..."
	@dfx start --background --clean
	@echo "✅ DFX replica started."

stop: ## Stop DFX replica
	@echo "🔴 Stopping DFX replica..."
	@dfx stop
	@echo "✅ DFX replica stopped."

deploy: ## Deploy canisters to local network
	@echo "🚀 Deploying canisters..."
	@dfx deploy
	@echo "✅ Deployment completed."

dev: start deploy ## Start complete development environment
	@echo "🎉 Development environment ready!"
	@echo "Frontend: http://localhost:4943"
	@echo "Candid UI: http://localhost:4943/?canisterId=$$(dfx canister id __Candid_UI)"

# Testing and Model Operations
test: ## Run all tests
	@echo "🧪 Running tests..."
	@cargo test
	@cd src/frontend && npm test
	@dfx canister call ai_canister health_check
	@echo "✅ All tests completed."

test-health: ## Quick health check
	@echo "🩺 Health check..."
	@dfx canister call ai_canister health_check

test-model: ## Test model integrity
	@echo "🔍 Testing model integrity..."
	@dfx canister call ai_canister verify_model_integrity

# Model Upload and Initialization
upload-model: ## Upload model chunks to AI canister
	@echo "📤 Uploading model to canister..."
	@./scripts/upload-model.sh
	@echo "✅ Model upload completed."

setup-model-complete: ## Complete model upload and streaming initialization
	@echo "🚀 Running complete model setup..."
	@./scripts/setup-model-complete.sh
	@echo "✅ Complete model setup finished."

stream-init-demo: ## Demo streaming model initialization
	@echo "🚀 Running streaming initialization demo..."
	@./scripts/demo-streaming-init.sh
	@echo "✅ Demo completed."

# Performance and Quality Assurance
test-performance: ## Test streaming initialization performance
	@echo "⚡ Running performance tests..."
	@./scripts/test-performance-advanced.sh
	@echo "✅ Performance testing completed."

test-error-recovery: ## Test error recovery scenarios
	@echo "🛡️ Running error recovery tests..."
	@./scripts/test-error-recovery.sh
	@echo "✅ Error recovery testing completed."

integration-test: ## Run comprehensive integration test
	@echo "🎯 Running final integration test..."
	@./scripts/final-integration-test.sh
	@echo "✅ Integration testing completed."

# Combined workflows
full-setup: setup setup-model-complete ## Complete setup with model upload and initialization
	@echo "🎉 VeriChain fully ready with initialized model!"

qa-suite: test-performance test-error-recovery integration-test ## Run complete QA test suite
	@echo "🏆 All QA tests completed successfully!"

# Maintenance
clean: ## Clean all build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@cargo clean
	@rm -rf .dfx target
	@cd src/frontend && rm -rf dist node_modules
	@echo "✅ Cleanup completed."

reset: clean setup ## Reset and rebuild everything
	@echo "🔄 Complete project reset..."
	@echo "✅ Project reset completed!"

all: setup deploy test ## Complete setup, deployment, and testing
	@echo "🎉 VeriChain is fully ready!"

# Docker support
docker-build: ## Build Docker image for development
	@echo "🐳 Building Docker image..."
	@docker build -t verichain:latest .
	@echo "✅ Docker image built."

docker-dev: ## Start development environment with Docker
	@echo "🐳 Starting Docker development environment..."
	@docker-compose up --build -d
	@echo "✅ Docker environment started."
	@echo "Access at: http://localhost:3000"

docker-stop: ## Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down
	@echo "✅ Docker containers stopped."

docker-clean: docker-stop ## Clean Docker resources
	@echo "🧹 Cleaning Docker resources..."
	@docker-compose down -v
	@docker rmi verichain:latest 2>/dev/null || true
	@docker system prune -f
	@echo "✅ Docker cleanup completed."

# Utilities
check: ## Check system requirements
	@echo "🔍 Checking system requirements..."
	@echo "Node.js: $$(node --version)"
	@echo "NPM: $$(npm --version)"
	@echo "Rust: $$(rustc --version)"
	@echo "Cargo: $$(cargo --version)"
	@echo "DFX: $$(dfx --version)"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'Not installed')"

status: ## Show project status
	@echo "📊 VeriChain Project Status"
	@echo "=========================="
	@echo "DFX Status: $$(dfx ping local 2>/dev/null && echo 'Running' || echo 'Stopped')"
	@echo "Frontend built: $$([ -d src/frontend/dist ] && echo 'Yes' || echo 'No')"
	@echo "Model present: $$([ -f src/ai_canister/assets/model_metadata.json ] && echo 'Yes' || echo 'No')"
	@echo "Canisters: $$(dfx canister status ai_canister 2>/dev/null | grep Status || echo 'Not deployed')"

logs: ## Show canister logs
	@echo "📋 Showing recent canister logs..."
	@dfx canister logs ai_canister || echo "No logs available"

# Advanced commands
update: ## Update all dependencies
	@echo "⬆️ Updating dependencies..."
	@cargo update
	@cd src/frontend && npm update
	@echo "✅ Dependencies updated."

package: build ## Package for distribution
	@echo "📦 Creating distribution package..."
	@tar -czf verichain-dist.tar.gz src/frontend/dist .dfx/local/canisters
	@echo "✅ Package created: verichain-dist.tar.gz"

bench: ## Run benchmarks
	@echo "⚡ Running benchmarks..."
	@cargo bench
	@echo "✅ Benchmarks completed."

test-social-media: ## Test social media upload workflow
	@echo "🌐 Testing social media workflow..."
	@./scripts/test-social-media.sh
