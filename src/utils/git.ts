import { execSync } from 'node:child_process';
import { Octokit } from '@octokit/rest';
import pc from 'picocolors';
import { getTokenForOwner, hasAnyToken } from '../config.ts';
import { log } from './log.ts';

export function detectRepoFromGit(): string | null {
  try {
    const url = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const sshMatch = url.match(/github\.com[:/](.+?\/.+?)(?:\.git)?$/);
    if (sshMatch?.[1]) return sshMatch[1];
    const httpsMatch = url.match(/github\.com\/(.+?\/.+?)(?:\.git)?$/);
    if (httpsMatch?.[1]) return httpsMatch[1];
  } catch {
    // not in a git repo or no remote
  }
  return null;
}

export interface ResolvedRepo {
  owner: string;
  name: string;
  slug: string;
  token: string;
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export function parseRepo(repoArg?: string): Omit<ResolvedRepo, 'token'> {
  const slug = repoArg ?? detectRepoFromGit();
  if (!slug) {
    throw new Error('Could not detect repository. Use --repo <owner/repo> or run from inside a git repo.');
  }
  const [owner, name] = slug.split('/');
  if (!owner || !name) {
    throw new Error('Invalid repo format. Expected: owner/repo');
  }
  return { owner, name, slug };
}

export async function resolveRepo(repoArg?: string): Promise<ResolvedRepo> {
  const { owner, name, slug } = parseRepo(repoArg);

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
    const { addToken } = await import('../commands/add-token.ts');
    await addToken();
    token = await getTokenForOwner(owner);
    if (!token) {
      log.error("Token was saved but doesn't match this owner. Run: llm-toolkit add-token");
      process.exit(1);
    }
  }

  return { owner, name, slug, token };
}

export async function listOpenPulls(repo: ResolvedRepo) {
  const { owner, name, token } = repo;
  const octokit = createOctokit(token);
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo: name,
    state: 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: 30,
  });
  return data;
}
