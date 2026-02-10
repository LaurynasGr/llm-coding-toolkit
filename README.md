# LLM Coding Toolkit

A CLI with helpful commands for coding with LLMs.

## Install

```sh
bun install -g llm-coding-toolkit
pnpm install -g llm-coding-toolkit
npm install -g llm-coding-toolkit
```

## Usage

```sh
llm-toolkit <command> [options]
```

### Commands

| Command | Description |
| --- | --- |
| `prs` | List open pull requests for a repo |
| `add-token` | Add a GitHub API token |
| `list-tokens` | List configured tokens |

### Examples

```sh
# List open PRs (auto-detects repo from git remote)
llm-toolkit prs

# List open PRs for a specific repo
llm-toolkit prs --repo owner/repo
```

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

Compiles to a standalone binary at `dist/llm-toolkit`.

### Lint

```sh
make lint        # check for issues
make lint-fix    # auto-fix ESLint issues + type check
```
