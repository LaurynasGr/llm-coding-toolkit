.PHONY:
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

gh-login: ## Login to GitHub
	gh auth login

build: ## Bundle CLI for Node
	bun run build

lint: ## Run linters
	bun run lint

lint-fix: ## Run linters and fix issues
	bun run lint:fix
