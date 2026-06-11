# LLM Coding Toolkit

A CLI with helpful commands for coding with LLMs.

## Requirements

- Node.js 20+
- A GitHub token with **Pull requests (read-only)** permission

## Installation

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

### review-comments

```sh
llmct review-comments
```

Fetches unresolved review threads from a PR, strips bot noise, and writes a clean markdown file to `.llm-coding-toolkit/agent-reviews/`. If there's a single open PR it's auto-selected; otherwise an interactive picker is shown. It also ensures `.llm-coding-toolkit/` is added to your repo `.gitignore`.

### messages

```sh
llmct messages
```

Save reusable message templates with variable placeholders (`{{VarName:"default"}}`). Pick a message, fill in variables, and the resolved text is copied to your clipboard. Templates are stored in `~/.config/llm-coding-toolkit/messages.json`.

### gh-auth

```sh
llmct gh-auth
```

Authenticates the GitHub CLI (`gh`) with a stored token. Detects the current repo and uses the matching token entry (owner-specific or `default`); if no repo or matching token is found, an interactive token picker is shown. Run `llmct gh-auth pick` to choose the token explicitly. The token is piped to `gh auth login --with-token` so it never appears in command arguments or logs.

### Commands

| Command | Description |
| --- | --- |
| `review-comments` | Collect unresolved PR review comments into a markdown file to pass to an LLM agent |
| `prs` | List open pull requests for a repo |
| `add-token` | Add a GitHub API token |
| `list-tokens` | List configured tokens |
| `gh-auth` | Authenticate the GitHub CLI (`gh`) with a stored token |
| `autocomplete` | Install shell autocomplete for `llmct` |
| `messages` | Manage reusable message templates with variable substitution |

### More examples

```sh
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

# Authenticate gh, picking the token interactively
llmct gh-auth pick

# Install shell autocomplete for the current shell (zsh/bash/fish)
llmct autocomplete

# Add a new message template
llmct messages add

# Update or remove a message template
llmct messages update
llmct messages remove
```

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
