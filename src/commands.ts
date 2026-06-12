export const COMMANDS = {
  'review-comments': 'Collect unresolved PR review comments for an LLM agent',
  prs: 'List open pull requests',
  github: 'Authenticate the GitHub CLI (gh) and manage API tokens',
  autocomplete: 'Install shell autocomplete for llmct',
  messages: 'Manage reusable message templates',
} as const;

export const SUBCOMMANDS = {
  github: {
    auth: 'Authenticate gh with the token matching the current repo',
    'add-token': 'Add a GitHub API token',
    'list-tokens': 'List configured tokens',
  },
  messages: {
    add: 'Add a new message template',
    update: 'Update an existing message template',
    remove: 'Remove a message template',
  },
} as const satisfies { [key in keyof typeof COMMANDS]?: Record<string, string> };

export const FLAGS = [
  { name: '--help', short: '-h', description: 'Show help message' },
  { name: '--version', short: '-v', description: 'Show version number' },
] as const satisfies { name: string; short?: string; description: string }[];

export const GLOBAL_FLAGS = Object.fromEntries(
  FLAGS.flatMap(({ name, short, description }) =>
    short
      ? [
          [name, description],
          [short, description],
        ]
      : [[name, description]],
  ),
);
