# LLM Coding Toolkit

A CLI with helpful commands for coding with LLMs.

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

### Commands

| Command | Description |
| --- | --- |
| `review-comments` | Collect unresolved PR review comments into a markdown file to pass to an LLM agent |
| `prs` | List open pull requests for a repo |
| `add-token` | Add a GitHub API token |
| `list-tokens` | List configured tokens |

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
```

The `review-comments` command fetches unresolved review threads from a PR, strips bot noise (HTML, Cursor/Greptile links), and writes a clean markdown file to `.llm-coding-toolkit/agent-reviews/`. If there's a single open PR it's auto-selected; otherwise an interactive picker is shown.

## Stack

- **Runtime**: [Bun](https://bun.sh) — TypeScript executed directly, no build step needed for dev
- **GitHub API**: [`@octokit/rest`](https://github.com/octokit/rest.js)
- **Interactive prompts**: [`@clack/prompts`](https://github.com/bombshell-dev/clack)
- **Terminal colors**: [`picocolors`](https://github.com/alexeyraspopov/picocolors)
- **Linting**: ESLint + Prettier + `typescript-eslint`

## Development

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
