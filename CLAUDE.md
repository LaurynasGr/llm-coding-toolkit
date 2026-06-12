# LLM Coding Toolkit

Instructions for AI agents working on this codebase.

## General rules

- Do not include any code snippets in your "Here's what I did" summaries once you're finished with a task
- Do not use `-C <path>` with git commands - just run `git` directly (the working directory is already correct)
- When learning useful conventions or patterns from our interactions, add them to this CLAUDE.md file (not to the memory directory)
- Only add a `Co-Authored-By: <agent>` trailer to a commit when the agent actually wrote the code or a comparable share of it (roughly 50/50 co-authorship). Do not add it when committing code the user wrote, even if the agent made minor adjustments to it.

## Running

- Local dev: `./cli.ts <command> [options]`
- Installed binary: `llmct <command> [options]`
  - `review-comments` — collect unresolved PR review comments into a markdown file for an LLM agent (`--repo owner/repo` or auto-detect)
  - `prs` — list open PRs (`--repo owner/repo` or auto-detect from git remote)
  - `github` — GitHub CLI auth and token management; no subcommand shows an interactive picker (subcommands: `auth` to authenticate `gh` with the token matching the current repo, `add-token` to add a default or owner/org-scoped token, `list-tokens` to list configured tokens)
  - `autocomplete` — install shell autocomplete for `llmct`
  - `messages` — manage reusable message templates with variable substitution (subcommands: `add`, `update`, `remove`)

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
  - `github/` — GitHub CLI auth and token management (`index.ts` — command entry, `login.ts` — pipe a token to `gh auth login`, `add-token.ts` — add a GitHub API token, `list-tokens.ts` — list configured tokens)
  - `autocomplete.ts` — install shell autocomplete (zsh/bash/fish)
  - `messages.ts` — manage reusable message templates
- `src/messages.ts` — message storage (stored in `~/.config/llm-coding-toolkit/messages.json`)

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
