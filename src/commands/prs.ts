import { Octokit } from '@octokit/rest';
import { parseArgs } from 'node:util';
import { intro, outro, spinner } from '@clack/prompts';
import { log, detectRepoFromGit } from '../utils';
import pc from 'picocolors';
import { getTokenForOwner, hasAnyToken } from '../config.ts';
import { addToken } from './add-token.ts';

export async function prs(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      repo: { type: 'string', short: 'r' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(`Usage: ${pc.bold('llm-toolkit prs')} [options]

List open pull requests for a GitHub repository.

Options:
  ${pc.bold('-r, --repo')} ${pc.dim('<owner/repo>')}  GitHub repository (default: detected from git remote)
  ${pc.bold('-h, --help')}               Show this help message`);
    process.exit(0);
  }

  const repo = values.repo ?? detectRepoFromGit();
  if (!repo) {
    log.error('Could not detect repository. Use --repo <owner/repo> or run from inside a git repo.');
    process.exit(1);
  }

  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    log.error('Invalid repo format. Expected: owner/repo');
    process.exit(1);
  }

  let token = await getTokenForOwner(owner);
  if (!token) {
    if (await hasAnyToken()) {
      log.error([
        `No token found for owner '${owner}' and no default token configured.`,
        pc.dim('Run: llm-toolkit add-token'),
      ]);
      process.exit(1);
    }
    log.warn('No GitHub API token configured.');
    await addToken();
    token = await getTokenForOwner(owner);
    if (!token) {
      log.error("Token was saved but doesn't match this owner. Run: llm-toolkit add-token");
      process.exit(1);
    }
  }

  intro(pc.bold(`Pull Requests - ${pc.cyan(repo)}`));

  const octokit = new Octokit({ auth: token });
  const s = spinner();

  try {
    s.start('Fetching open pull requests');

    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo: name,
      state: 'open',
      sort: 'updated',
      direction: 'desc',
      per_page: 30,
    });

    s.stop('Fetched pull requests');

    if (pulls.length === 0) {
      outro(`No open PRs in ${pc.cyan(repo)}`);
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
      log.error(['Authentication failed. Your token may be invalid or expired.', pc.dim('Run: llm-toolkit add-token')]);
      process.exit(1);
    }
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      log.error(`Repository '${repo}' not found (or you don't have access).`);
      process.exit(1);
    }
    throw err;
  }
}
