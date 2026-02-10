import { execSync } from 'node:child_process';

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
