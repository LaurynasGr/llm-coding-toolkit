import { parseArgs } from 'node:util';
import { intro, outro, select, isCancel, cancel } from '@clack/prompts';
import pc from 'picocolors';
import { log, printCommandHelp, detectRepoFromGit } from '../../utils/index.ts';
import { readConfig, getTokenEntryForOwner } from '../../config.ts';
import type { TokenEntry } from '../../config.ts';
import { SUBCOMMANDS } from '../../commands.ts';
import { loginWithToken } from './login.ts';

function printHelp() {
  printCommandHelp({
    command: 'gh-auth',
    usage: '[subcommand]',
    description: 'Authenticate the GitHub CLI (gh) with a token stored by llmct.',
    subcommands: SUBCOMMANDS['gh-auth'],
    footer: 'Run without a subcommand to use the token matching the current repo.',
  });
}

async function pickTokenEntry(): Promise<TokenEntry> {
  const config = await readConfig();
  const labels = Object.keys(config.tokens);

  if (labels.length === 0) {
    log.error(['No tokens configured.', pc.dim('Run: llmct add-token')]);
    process.exit(1);
  }

  const choice = await select({
    message: 'Select a token',
    options: labels.map((label) => ({ value: label, label })),
  });

  if (isCancel(choice)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  return { label: choice, token: config.tokens[choice]! };
}

export async function ghAuth(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  intro(pc.bold('GitHub CLI Auth'));

  let entry: TokenEntry | null = null;

  if (positionals[0] !== 'pick') {
    const slug = detectRepoFromGit();
    if (!slug) {
      log.warn('Could not detect a GitHub repository here. Pick a token instead.');
    } else {
      const [owner] = slug.split('/');
      if (!owner) {
        log.warn('Could not parse repository owner. Pick a token instead.');
      } else {
        entry = await getTokenEntryForOwner(owner);
        if (entry) {
          log.info(`Detected repo ${pc.cyan(slug)}.`);
        } else {
          log.warn(`No token configured for owner '${owner}'. Pick a token instead.`);
        }
      }
    }
  }

  if (!entry) {
    entry = await pickTokenEntry();
  }

  loginWithToken(entry);

  outro(pc.green('Done'));
}
