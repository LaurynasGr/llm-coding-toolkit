import { intro, outro } from '@clack/prompts';
import { log } from '../utils';
import pc from 'picocolors';
import { readConfig } from '../config.ts';

export async function listTokens() {
  const config = await readConfig();
  const owners = Object.keys(config.tokens);

  if (owners.length === 0) {
    log.warn(`No tokens configured. Run: ${pc.bold('llmct add-token')}`);
    return;
  }

  intro(pc.bold('Configured Tokens'));

  for (const owner of owners) {
    const token = config.tokens[owner]!;
    const masked = token.slice(0, 4) + pc.dim('*****') + token.slice(-4);
    log.message(`${pc.cyan(owner)}  ${masked}`);
  }

  outro(pc.dim(`${owners.length} token${owners.length === 1 ? '' : 's'} configured`));
}
