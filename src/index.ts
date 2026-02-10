#!/usr/bin/env bun

import type { components } from "@octokit/openapi-types";
import { Octokit } from "@octokit/rest";
import { env } from "./env";

type Repository = components["schemas"]["repository"]

async function getAllRepos(pageSize = 5): Promise<Repository[]> {
  const tokens = env.GITHUB_TOKENS;
  const repos = new Map<number, Repository>();

  for (const token of tokens) {
    const octokit = new Octokit({ auth: token });
    const response = await octokit.request("GET /user/repos", {
      sort: "pushed",
      per_page: pageSize,
    });
    response.data.forEach((repo) => {
      if (repo) {
        repos.set(repo.id, repo);
      }
    });
  }

  return Array.from(repos.values());
}

const repos = await getAllRepos();
const reposData = repos.map((repo) => ({
  name: repo.name,
  description: repo.description,
  url: repo.html_url,
  private: repo.private,
  created_at: repo.created_at,
  updated_at: repo.updated_at,
  pushed_at: repo.pushed_at,
})).sort((a, b) => {
  if (!a.pushed_at || !b.pushed_at) return 0;
  if (a.pushed_at === b.pushed_at) return 0;
  return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
});

console.log(reposData);
