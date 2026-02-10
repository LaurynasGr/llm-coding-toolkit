import { intro, outro, text, password, isCancel, cancel } from '@clack/prompts';
import { log } from '../utils';
import pc from 'picocolors';
import { readConfig, writeConfig, CONFIG_FILE } from '../config.ts';

export async function addToken() {
  intro(pc.bold('Add GitHub API Token'));

  const owner = await text({
    message: 'Owner/organization this token is for',
    placeholder: 'Press Enter to use as default',
  });

  if (isCancel(owner)) {
    cancel('Token setup cancelled.');
    process.exit(0);
  }

  const key = owner.trim() || 'default';

  log.info([
    `Create a fine-grained token at: ${pc.underline('https://github.com/settings/personal-access-tokens/new')}`,
    `Required permission: ${pc.bold('Pull Requests')} (read-only)`,
  ]);

  const token = await password({
    message: 'Enter your GitHub API token',
    validate: (value) => {
      if (!value?.trim()) return 'Token cannot be empty';
    },
  });

  if (isCancel(token)) {
    cancel('Token setup cancelled.');
    process.exit(0);
  }

  const config = await readConfig();
  config.tokens[key] = token.trim();
  await writeConfig(config);

  outro(pc.green(`Token saved for '${key}' in ${CONFIG_FILE}`));
}
