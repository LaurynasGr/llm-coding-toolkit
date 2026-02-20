# LLM Coding Toolkit

Instructions for AI agents working on this codebase.

## General rules

- Do not include any code snippets in your "Here's what I did" summaries once you're finished with a task
- Do not use `-C <path>` with git commands - just run `git` directly (the working directory is already correct)
- When learning useful conventions or patterns from our interactions, add them to this CLAUDE.md file (not to the memory directory)


## Running

- Local dev: `./cli.ts <command> [options]`
- Installed binary: `llmct <command> [options]`
  - `review-comments` — collect unresolved PR review comments into a markdown file for an LLM agent (`--repo owner/repo` or auto-detect)
  - `prs` — list open PRs (`--repo owner/repo` or auto-detect from git remote)
  - `add-token` — add a GitHub API token (default token or owner/org-scoped token)
  - `list-tokens` — list configured tokens
  - `autocomplete` — install shell autocomplete for `llmct`

## Project structure

- `cli.ts` — CLI entrypoint, command router (executable)
- `src/commands.ts` — shared `COMMANDS` record (name → description), used by CLI and autocomplete
- `src/config.ts` — GitHub token management (stored in `~/.config/llm-coding-toolkit/config.json`)
- `src/utils/` — shared utilities
  - `git.ts` — git helpers (e.g. `detectRepoFromGit`)
  - `log.ts` — logging helpers
- `src/commands/` — command implementations
  - `review-comments.ts` — collect unresolved PR review comments into markdown
  - `prs.ts` — list open pull requests
  - `add-token.ts` — add a GitHub API token
  - `list-tokens.ts` — list configured tokens
  - `autocomplete.ts` — install shell autocomplete (zsh/bash/fish)

## Key details

- Runtime: Bun (TypeScript executed directly)
- Build: `make build` — bundles to Node-targeted `dist/cli.mjs` via `bun build --target node --outfile dist/cli.mjs`
- GitHub API client: `@octokit/rest` (REST) + `octokit.graphql` (GraphQL for review threads)
- Interactive prompts: `@clack/prompts`
- Terminal colors: `picocolors`
- Token storage: `~/.config/llm-coding-toolkit/config.json` with 0600 permissions, supports default and owner/org-mapped tokens

## Linting

- `make lint` — run ESLint and TypeScript type checking
- `make lint-fix` — run ESLint with auto-fix and TypeScript type checking
- Always run `make lint-fix` after making changes to fix types and ESLint issues

## Code style

- No default exports — always use named exports
