import { spawnSync } from 'node:child_process';
import pc from 'picocolors';
import { log } from '../../utils/index.ts';
import type { TokenEntry } from '../../config.ts';

export function loginWithToken(entry: TokenEntry): void {
  // The token is passed via stdin so it never appears in argv or logs.
  const login = spawnSync('gh', ['auth', 'login', '--with-token'], { input: entry.token, encoding: 'utf-8' });

  if (login.error) {
    if ((login.error as NodeJS.ErrnoException).code === 'ENOENT') {
      log.error(['GitHub CLI (gh) not found.', pc.dim('Install it from https://cli.github.com')]);
      process.exit(1);
    }
    throw login.error;
  }

  if (login.status !== 0) {
    log.error([`gh auth login failed (exit ${login.status}).`, (login.stderr || login.stdout).trim()].filter(Boolean));
    process.exit(1);
  }

  log.success(`Authenticated gh using the ${pc.cyan(entry.label)} token.`);

  const status = spawnSync('gh', ['auth', 'status'], { encoding: 'utf-8' });
  const statusOutput = [status.stdout, status.stderr]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join('\n');
  if (statusOutput) {
    log.message(statusOutput);
  }
}
