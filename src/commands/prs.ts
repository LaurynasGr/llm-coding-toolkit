import { parseArgs } from 'node:util';
import { intro, outro, spinner } from '@clack/prompts';
import { log, printCommandHelp, resolveRepo, listOpenPulls } from '../utils/index.ts';
import pc from 'picocolors';

export async function prs(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      repo: { type: 'string', short: 'r' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    printCommandHelp({
      command: 'prs',
      usage: '[options]',
      description: 'List open pull requests for a GitHub repository.',
      options: [
        {
          flag: '-r, --repo',
          arg: '<owner/repo>',
          description: 'GitHub repository (default: detected from git remote)',
        },
      ],
    });
    process.exit(0);
  }

  const repo = await resolveRepo(values.repo);

  intro(pc.bold(`Pull Requests - ${pc.cyan(repo.slug)}`));

  const s = spinner();

  try {
    s.start('Fetching open pull requests');

    const pulls = await listOpenPulls(repo);

    s.stop('Fetched pull requests');

    if (pulls.length === 0) {
      outro(`No open PRs in ${pc.cyan(repo.slug)}`);
      process.exit(0);
    }

    log.message(pc.dim(`${pulls.length} open`));

    for (const pr of pulls) {
      const number = pc.yellow(`#${pr.number}`);
      const title = pc.bold(pr.title);
      const draft = pr.draft ? pc.dim(' [DRAFT]') : '';
      const labels = pr.labels.map((l) => pc.magenta(l.name)).join(pc.dim(', '));
      const labelStr = labels ? pc.dim(' (') + labels + pc.dim(')') : '';
      const author = pc.dim(`by ${pr.user?.login ?? 'unknown'}`);
      const updated = pc.dim(`updated ${pr.updated_at}`);
      const url = pc.dim(pr.html_url);

      log.message([`${number} ${title}${draft}${labelStr}`, `   ${author} · ${updated}`, `   ${url}`]);
    }

    outro(pc.green('Done'));
  } catch (err: unknown) {
    s.stop('Failed');

    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
      log.error([
        'Authentication failed. Your token may be invalid or expired.',
        pc.dim('Run: llmct github add-token'),
      ]);
      process.exit(1);
    }
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      log.error(`Repository '${repo.slug}' not found (or you don't have access).`);
      process.exit(1);
    }
    throw err;
  }
}
