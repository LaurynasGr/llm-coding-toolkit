.PHONY:
help:
	@echo Tasks:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

gh-login: ## Login to GitHub
	gh auth login

build: ## Compile into a standalone binary
	bun build --compile cli.ts --outfile dist/llm-toolkit
