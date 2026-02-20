#!/usr/bin/env node

import pc from 'picocolors';
import { COMMANDS } from './src/commands.ts';

function printUsage() {
  console.log(`Usage: ${pc.bold('llmct')} ${pc.dim('<command> [options]')}

Commands:`);
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${pc.bold(name.padEnd(16))} ${pc.dim(desc)}`);
  }
  console.log(`\n${pc.dim("Run 'llmct <command> --help' for command-specific options.")}`);
}

const command = process.argv[2];

if (!command || command === '--help' || command === '-h') {
  printUsage();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  const { readFile } = await import('node:fs/promises');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const dir = dirname(fileURLToPath(import.meta.url));
  const pkg = await readFile(join(dir, 'package.json'), 'utf-8').catch(() =>
    readFile(join(dir, '..', 'package.json'), 'utf-8'),
  );
  const { version } = JSON.parse(pkg) as { version: string };
  console.log(version);
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
  case 'autocomplete': {
    const { autocomplete } = await import('./src/commands/autocomplete.ts');
    await autocomplete(commandArgs);
    break;
  }
  default:
    console.error(pc.red(`Unknown command: ${command}\n`));
    printUsage();
    process.exit(1);
}
