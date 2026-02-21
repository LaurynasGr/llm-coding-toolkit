#!/usr/bin/env node

import pc from 'picocolors';
import { COMMANDS, FLAGS } from './src/commands.ts';

function printUsage() {
  const commandLines = Object.entries(COMMANDS)
    .map(([name, desc]) => `  ${pc.bold(name.padEnd(16))} ${pc.dim(desc)}`)
    .join('\n');

  const flagLines = FLAGS.map(({ name, short, description }) => {
    const label = short ? `${short}, ${name}` : name;
    return `  ${pc.bold(label.padEnd(16))} ${pc.dim(description)}`;
  }).join('\n');

  console.log(`Usage: ${pc.bold('llmct')} ${pc.dim('<command> [options]')}

Commands:
${commandLines}

Options:
${flagLines}

${pc.dim("Run 'llmct <command> --help' for command-specific options.")}`);
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
  case 'messages': {
    const { messages } = await import('./src/commands/messages.ts');
    await messages(commandArgs);
    break;
  }
  default:
    console.error(pc.red(`Unknown command: ${command}\n`));
    printUsage();
    process.exit(1);
}
