#!/usr/bin/env node

import pc from 'picocolors';

const COMMANDS: Record<string, string> = {
  'review-comments': 'Collect unresolved PR review comments for an LLM agent',
  prs: 'List open pull requests',
  'add-token': 'Add a GitHub API token',
  'list-tokens': 'List configured tokens',
};

function printUsage() {
  console.log(`Usage: ${pc.bold('llm-toolkit')} ${pc.dim('<command> [options]')}

Commands:`);
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${pc.bold(name.padEnd(16))} ${pc.dim(desc)}`);
  }
  console.log(`\n${pc.dim("Run 'llm-toolkit <command> --help' for command-specific options.")}`);
}

const command = process.argv[2];

if (!command || command === '--help' || command === '-h') {
  printUsage();
  process.exit(0);
}

const commandArgs = process.argv.slice(3);

switch (command) {
  case 'review-comments': {
    const { reviewComments } = await import('./src/commands/review-comments.ts');
    await reviewComments(commandArgs);
    break;
  }
  case 'prs': {
    const { prs } = await import('./src/commands/prs.ts');
    await prs(commandArgs);
    break;
  }
  case 'add-token': {
    const { addToken } = await import('./src/commands/add-token.ts');
    await addToken();
    break;
  }
  case 'list-tokens': {
    const { listTokens } = await import('./src/commands/list-tokens.ts');
    await listTokens();
    break;
  }
  default:
    console.error(pc.red(`Unknown command: ${command}\n`));
    printUsage();
    process.exit(1);
}
