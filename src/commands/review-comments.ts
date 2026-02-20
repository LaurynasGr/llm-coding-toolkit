import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { intro, outro, spinner, select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { log, resolveRepo, listOpenPulls, listUnresolvedReviewThreads, detectRepoRoot } from '../utils';
import type { ReviewThread } from '../utils/git.ts';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatLineRef(thread: Pick<ReviewThread, 'path' | 'startLine' | 'line'>): string {
  if (thread.startLine && thread.line && thread.startLine !== thread.line) {
    return `${thread.path}:${thread.startLine}-${thread.line}`;
  }
  if (thread.line) {
    return `${thread.path}:${thread.line}`;
  }
  return thread.path;
}

async function ensureGitignored(repoRoot: string, entry: string): Promise<void> {
  const gitignorePath = join(repoRoot, '.gitignore');
  let content = '';
  try {
    content = await readFile(gitignorePath, 'utf-8');
  } catch {
    // no .gitignore yet
  }
  const lines = content.split('\n');
  if (lines.some((line) => line.trim() === entry || line.trim() === `${entry}/`)) {
    return;
  }
  const suffix = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  await appendFile(gitignorePath, `${suffix}${entry}/\n`);
}

function sanitizeBody(body: string): string {
  // protect backtick-wrapped content (code blocks and inline code) from HTML stripping
  const preserved: string[] = [];
  let protected_ = body.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    preserved.push(match);
    return `%%CODE_${preserved.length - 1}%%`;
  });

  protected_ = protected_
    // strip HTML comments (<!-- ... -->, potentially multiline)
    .replace(/<!--[\s\S]*?-->/g, '')
    // strip "Additional Locations" section and everything after it (review bot appendix)
    .replace(/Additional Locations \(\d+\)[\s\S]*$/g, '')
    // strip markdown links to github blob URLs (bot-generated file references)
    .replace(/\[.*?\]\(https:\/\/github\.com\/[^)]*\/blob\/[^)]+\)/g, '')
    // strip bot HTML tags (details, summary, p, a, picture, source, img, br, hr)
    .replace(/<\/?(details|summary|p|a|picture|source|img|br|hr)\b[^>]*>/gi, '')
    // strip &nbsp; entities
    .replace(/&nbsp;?/g, '')
    // collapse 3+ consecutive blank lines into 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // restore backtick-wrapped content
  return protected_.replace(/%%CODE_(\d+)%%/g, (_, i) => preserved[Number(i)] ?? '');
}

function generateMarkdown(threads: ReviewThread[]): string {
  const lines = [
    'Below are comments from other agents that have reviewed the code changes.',
    'If they are valid, fix them. Otherwise, ignore them and let me know why.',
    '',
  ];

  for (const thread of threads) {
    lines.push(`- @${formatLineRef(thread)}`);
    lines.push('');
    for (const comment of thread.comments) {
      const body = sanitizeBody(comment.body);
      lines.push(`  **${comment.author}:**`);
      const indented = body
        .split('\n')
        .map((l) => `  ${l}`)
        .join('\n');
      lines.push(indented);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}

export async function reviewComments(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      repo: { type: 'string', short: 'r' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(`Usage: ${pc.bold('llm-toolkit review-comments')} [options]

Collect unresolved PR review comments into a markdown file for an LLM agent.

Options:
  ${pc.bold('-r, --repo')} ${pc.dim('<owner/repo>')}  GitHub repository (default: detected from git remote)
  ${pc.bold('-h, --help')}               Show this help message`);
    process.exit(0);
  }

  const repo = await resolveRepo(values.repo);

  intro(pc.bold(`Review Comments - ${pc.cyan(repo.slug)}`));

  const s = spinner();

  try {
    s.start('Fetching open pull requests');
    const pulls = await listOpenPulls(repo);
    s.stop('Fetched pull requests');

    if (pulls.length === 0) {
      outro(`No open PRs in ${pc.cyan(repo.slug)}`);
      process.exit(0);
    }

    let selectedPR: (typeof pulls)[number];

    if (pulls.length === 1) {
      selectedPR = pulls[0] as (typeof pulls)[number];
      log.info(`Using PR ${pc.yellow(`#${selectedPR.number}`)} ${pc.bold(selectedPR.title)}`);
    } else {
      const choice = await select({
        message: 'Select a pull request',
        options: pulls.map((pr) => ({
          value: pr.number,
          label: `#${pr.number} ${pr.title}`,
          hint: pr.draft ? 'DRAFT' : undefined,
        })),
      });

      if (isCancel(choice)) {
        outro(pc.dim('Cancelled'));
        process.exit(0);
      }

      const found = pulls.find((pr) => pr.number === choice);
      if (!found) {
        outro(pc.red('Could not find selected PR'));
        process.exit(1);
      }
      selectedPR = found;
    }

    s.start('Fetching unresolved review threads');
    const threads = await listUnresolvedReviewThreads(repo, selectedPR.number);
    s.stop('Fetched review threads');

    if (threads.length === 0) {
      outro(`No unresolved review comments on PR ${pc.yellow(`#${selectedPR.number}`)}`);
      process.exit(0);
    }

    const commentCount = threads.reduce((sum, t) => sum + t.comments.length, 0);
    log.info(
      `Found ${pc.bold(String(commentCount))} unresolved comment(s) across ${pc.bold(String(threads.length))} thread(s)`,
    );

    const baseDir = '.llm-coding-toolkit';
    const repoRoot = detectRepoRoot();
    const prSlug = slugify(`${selectedPR.number}-${selectedPR.title}`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const llmCTPath = join(baseDir, 'agent-reviews', prSlug);
    const dirPath = repoRoot ? join(repoRoot, llmCTPath) : llmCTPath;
    const filePath = join(dirPath, `${timestamp}.md`);

    await mkdir(dirPath, { recursive: true });
    if (repoRoot) {
      await ensureGitignored(repoRoot, baseDir);
    }
    await writeFile(filePath, generateMarkdown(threads));

    log.success(`Written to ${pc.bold(filePath)}`);
    outro(pc.green('Done'));
  } catch (err: unknown) {
    s.stop('Failed');

    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
      log.error(['Authentication failed. Your token may be invalid or expired.', pc.dim('Run: llm-toolkit add-token')]);
      process.exit(1);
    }
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      log.error(`Repository '${repo.slug}' not found (or you don't have access).`);
      process.exit(1);
    }
    throw err;
  }
}
