# VeriChain Professional Makefile
# Professional build system for VeriChain deepfake detection platform

.PHONY: help install setup dev build deploy test clean status check

# Default target
.DEFAULT_GOAL := help

# Configuration
SCRIPTS_DIR := scripts
SRC_DIR := src
BUILD_DIR := target
FRONTEND_DIR := $(SRC_DIR)/frontend

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m

define print_success
	@echo "$(GREEN)[SUCCESS]$(NC) $(1)"
endef

define print_warning
	@echo "$(YELLOW)[WARNING]$(NC) $(1)"
endef

define print_error
	@echo "$(RED)[ERROR]$(NC) $(1)"
endef

## Help
help: ## Show this help message
	@echo "VeriChain Professional Build System"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

## Setup Commands
check: ## Check prerequisites and system requirements
	@echo "Checking system prerequisites..."
	@bash $(SCRIPTS_DIR)/setup.sh check_prerequisites
	$(call print_success,"Prerequisites check completed")

install: ## Install all dependencies
	@echo "Installing dependencies..."
	@npm install
	@cd $(FRONTEND_DIR) && npm install
	$(call print_success,"Dependencies installed")

setup: ## 🚀 Complete instant setup for new users (one command setup)
	@echo "$(GREEN)Starting VeriChain Complete Setup...$(NC)"
	@echo "This will setup everything you need to run VeriChain!"
	@echo ""
	@bash $(SCRIPTS_DIR)/setup.sh
	$(call print_success,"🎉 VeriChain setup completed! Run 'make dev' to start.")

model-setup: ## Download and prepare AI model only
	@echo "Setting up AI model..."
	@bash $(SCRIPTS_DIR)/setup.sh download_model
	@bash $(SCRIPTS_DIR)/setup.sh chunk_model
	$(call print_success,"Model setup completed")

reset-setup: ## 🔄 Reset everything and start fresh setup
	@echo "$(YELLOW)Resetting VeriChain to clean state...$(NC)"
	@echo "This will remove all build artifacts and restart setup."
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@bash $(SCRIPTS_DIR)/reset-setup.sh
	$(call print_success,"Reset completed. Run 'make setup' to reinstall.")

clean-setup: ## 🧹 Clean setup (keeps dependencies, resets configuration)
	@echo "$(YELLOW)Cleaning setup while preserving dependencies...$(NC)"
	@bash $(SCRIPTS_DIR)/clean-setup.sh
	$(call print_success,"Clean setup completed.")

## Development Commands
dev: ## Start complete development environment
	@echo "Starting development environment..."
	@bash $(SCRIPTS_DIR)/dev.sh
	$(call print_success,"Development environment started")

dev-frontend: ## Start only frontend development server
	@echo "Starting frontend development server..."
	@cd $(FRONTEND_DIR) && npm start

dev-build: ## Fast development build
	@echo "Running development build..."
	@bash $(SCRIPTS_DIR)/build.sh dev
	$(call print_success,"Development build completed")

## Build Commands
build: ## Production build
	@echo "Running production build..."
	@bash $(SCRIPTS_DIR)/build.sh
	$(call print_success,"Production build completed")

build-frontend: ## Build frontend only
	@echo "Building frontend..."
	@cd $(FRONTEND_DIR) && npm run build
	$(call print_success,"Frontend build completed")

build-canister: ## Build canisters only
	@echo "Building canisters..."
	@cargo build --release --target wasm32-unknown-unknown
	$(call print_success,"Canister build completed")

## Deployment Commands
deploy: ## Deploy to configured network
	@echo "Deploying VeriChain..."
	@bash $(SCRIPTS_DIR)/deploy.sh
	$(call print_success,"Deployment completed")

deploy-local: ## Deploy to local network
	@echo "Deploying to local network..."
	@DEPLOY_NETWORK=local bash $(SCRIPTS_DIR)/deploy.sh
	$(call print_success,"Local deployment completed")

deploy-ic: ## Deploy to Internet Computer mainnet
	@echo "Deploying to Internet Computer..."
	@DEPLOY_NETWORK=ic bash $(SCRIPTS_DIR)/deploy.sh
	$(call print_success,"IC deployment completed")

## Testing Commands
test: ## Run all tests
	@echo "Running complete test suite..."
	@bash $(SCRIPTS_DIR)/test.sh
	$(call print_success,"All tests completed")

test-health: ## Quick health check
	@echo "Running health checks..."
	@bash $(SCRIPTS_DIR)/test.sh health
	$(call print_success,"Health check completed")

test-model: ## Test AI model functionality
	@echo "Testing AI model..."
	@bash $(SCRIPTS_DIR)/test.sh model
	$(call print_success,"Model tests completed")

test-performance: ## Performance benchmarking
	@echo "Running performance tests..."
	@bash $(SCRIPTS_DIR)/test-performance.sh
	$(call print_success,"Performance tests completed")

test-integration: ## Integration testing
	@echo "Running integration tests..."
	@bash $(SCRIPTS_DIR)/test.sh integration
	$(call print_success,"Integration tests completed")

qa-suite: ## Complete quality assurance suite
	@echo "Running QA suite..."
	@bash $(SCRIPTS_DIR)/test.sh qa
	$(call print_success,"QA suite completed")

## Maintenance Commands
clean: ## Clean build artifacts and temporary files
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(FRONTEND_DIR)/node_modules/.cache
	@rm -rf .dfx/local
	@rm -rf temp/
	@find . -name "*.log" -delete
	$(call print_success,"Cleanup completed")

clean-full: ## Full clean including dependencies
	@echo "Full cleanup including dependencies..."
	@$(MAKE) clean
	@rm -rf node_modules
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(BUILD_DIR)
	$(call print_success,"Full cleanup completed")

reset: ## Reset project to clean state
	@echo "Resetting project..."
	@$(MAKE) clean-full
	@dfx stop
	@rm -rf .dfx
	$(call print_warning,"Project reset - run 'make setup' to reinitialize")

## Status Commands
status: ## Check project status
	@echo "VeriChain Project Status"
	@echo "======================="
	@echo ""
	@echo "DFX Status:"
	@dfx ping && echo "✅ DFX is running" || echo "❌ DFX is not running"
	@echo ""
	@echo "Canister Status:"
	@dfx canister status --all 2>/dev/null || echo "❌ Canisters not deployed"
	@echo ""
	@echo "Frontend Status:"
	@if [ -d "$(FRONTEND_DIR)/dist" ]; then echo "✅ Frontend built"; else echo "❌ Frontend not built"; fi
	@echo ""

health: ## Comprehensive health check
	@echo "Running comprehensive health check..."
	@bash $(SCRIPTS_DIR)/test.sh health-detailed
	$(call print_success,"Health check completed")

## Utility Commands
logs: ## Show recent logs
	@echo "Recent VeriChain logs:"
	@tail -50 *.log 2>/dev/null || echo "No log files found"

cycles: ## Check and display cycles balance
	@echo "Checking cycles balance..."
	@dfx canister status ai_canister | grep -i cycles || echo "Cannot get cycles info"

upgrade: ## Upgrade canister code
	@echo "Upgrading canisters..."
	@dfx deploy --upgrade-unchanged
	$(call print_success,"Canister upgrade completed")

## Documentation
docs: ## Generate and serve documentation
	@echo "Generating documentation..."
	@echo "Documentation available in docs/ directory"
	@ls -la docs/

## Advanced Commands
benchmark: ## Run comprehensive benchmarks
	@echo "Running benchmarks..."
	@bash $(SCRIPTS_DIR)/benchmark.sh
	$(call print_success,"Benchmarks completed")

profile: ## Profile application performance
	@echo "Profiling application..."
	@bash $(SCRIPTS_DIR)/profile.sh
	$(call print_success,"Profiling completed")

audit: ## Security and code audit
	@echo "Running security audit..."
	@npm audit
	@cd $(FRONTEND_DIR) && npm audit
	$(call print_success,"Audit completed")