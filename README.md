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

## Development

### Build

```sh
make build
```

Compiles to a standalone binary at `dist/llm-toolkit`.
