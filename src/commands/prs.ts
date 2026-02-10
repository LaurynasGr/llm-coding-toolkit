import { Octokit } from "@octokit/rest";
import { parseArgs } from "node:util";
import { getTokenForOwner, hasAnyToken } from "../config.ts";
import { detectRepoFromGit } from "../utils.ts";
import { addToken } from "./add-token.ts";

export async function prs(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      repo: { type: "string", short: "r" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`Usage: llm-toolkit prs [options]

List open pull requests for a GitHub repository.

Options:
  -r, --repo <owner/repo>  GitHub repository (default: detected from git remote)
  -h, --help               Show this help message`);
    process.exit(0);
  }

  const repo = values.repo ?? detectRepoFromGit();
  if (!repo) {
    console.error("Could not detect repository. Use --repo <owner/repo> or run from inside a git repo.");
    process.exit(1);
  }

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    console.error("Invalid repo format. Expected: owner/repo");
    process.exit(1);
  }

  let token = await getTokenForOwner(owner);
  if (!token) {
    if (await hasAnyToken()) {
      console.error(`No token found for owner '${owner}' and no default token configured.`);
      console.error("Run: llm-toolkit add-token");
      process.exit(1);
    }
    console.log("No GitHub API token configured.\n");
    await addToken();
    token = await getTokenForOwner(owner);
    if (!token) {
      console.error("Token was saved but doesn't match this owner. Run: llm-toolkit add-token");
      process.exit(1);
    }
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo: name,
      state: "open",
      sort: "updated",
      direction: "desc",
      per_page: 30,
    });

    if (pulls.length === 0) {
      console.log(`No open PRs in ${repo}`);
      process.exit(0);
    }

    console.log(`\nOpen PRs in ${repo} (${pulls.length}):\n`);

    for (const pr of pulls) {
      const draft = pr.draft ? " [DRAFT]" : "";
      const labels = pr.labels.map((l) => l.name).join(", ");
      const labelStr = labels ? ` (${labels})` : "";
      console.log(`  #${pr.number} ${pr.title}${draft}${labelStr}`);
      console.log(`    by ${pr.user?.login ?? "unknown"} · updated ${pr.updated_at}`);
      console.log(`    ${pr.html_url}\n`);
    }
  } catch (err: unknown) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 401) {
      console.error("Authentication failed. Your token may be invalid or expired.");
      console.error("Run: llm-toolkit add-token");
      process.exit(1);
    }
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      console.error(`Repository '${repo}' not found (or you don't have access).`);
      process.exit(1);
    }
    throw err;
  }
}
