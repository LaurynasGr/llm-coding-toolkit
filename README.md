# LLM Coding Toolkit

A CLI with helpful commands for coding with LLMs.

## Requirements

- Node.js 20+
- A GitHub token with **Pull requests (read-only)** permission

## Install

```sh
bun install -g llm-coding-toolkit
```

```sh
pnpm install -g llm-coding-toolkit
```

```sh
npm install -g llm-coding-toolkit
```

## Usage

```sh
llmct <command> [options]
```

Run `llmct <command> --help` for command-specific options.

### Commands

| Command | Description |
| --- | --- |
| `review-comments` | Collect unresolved PR review comments into a markdown file to pass to an LLM agent |
| `prs` | List open pull requests for a repo |
| `add-token` | Add a GitHub API token |
| `list-tokens` | List configured tokens |
| `autocomplete` | Install shell autocomplete for `llmct` |

### Examples

```sh
# Collect unresolved PR review comments for an LLM agent (auto-detects repo)
llmct review-comments

# Collect review comments for a specific repo
llmct review-comments --repo owner/repo

# List open PRs (auto-detects repo from git remote)
llmct prs

# List open PRs for a specific repo
llmct prs --repo owner/repo

# Add a token (press Enter for default, or enter an owner/org)
llmct add-token

# List configured tokens
llmct list-tokens

# Install shell autocomplete for the current shell (zsh/bash/fish)
llmct autocomplete
```

The `review-comments` command fetches unresolved review threads from a PR, strips bot noise (HTML, Cursor/Greptile links), and writes a clean markdown file to `.llm-coding-toolkit/agent-reviews/`. If there's a single open PR it's auto-selected; otherwise an interactive picker is shown.

It also ensures `.llm-coding-toolkit/` is added to your repo `.gitignore`.

## Authentication

Before running `review-comments` or `prs`, add a GitHub token:

```sh
llmct add-token
```

- Press Enter at the owner prompt to store a `default` token.
- Enter an organization/owner name to store a token for that specific owner.
- Tokens are stored in `~/.config/llm-coding-toolkit/config.json`.

## Stack

- **Runtime**: [Bun](https://bun.sh) — TypeScript executed directly, no build step needed for dev
- **GitHub API**: [`@octokit/rest`](https://github.com/octokit/rest.js)
- **Interactive prompts**: [`@clack/prompts`](https://github.com/bombshell-dev/clack)
- **Terminal colors**: [`picocolors`](https://github.com/alexeyraspopov/picocolors)
- **Linting**: ESLint + Prettier + `typescript-eslint`

## Development

### Run locally

```sh
./cli.ts <command> [options]
```

### Build

```sh
make build
```

Compiles to `dist/cli.mjs` (Node-compatible).

### Lint

```sh
make lint        # check for issues
make lint-fix    # auto-fix ESLint issues + type check
```

## License

MIT
