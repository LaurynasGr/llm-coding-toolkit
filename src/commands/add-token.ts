import { readConfig, writeConfig, CONFIG_FILE } from "../config.ts";

export async function addToken() {
  const owner = prompt("Owner/organization this token is for (press Enter to use as default):");
  const key = owner?.trim() || "default";

  console.log("\nCreate a fine-grained token at: https://github.com/settings/personal-access-tokens/new");
  console.log("Required permission: Pull Requests (read-only)\n");

  const token = prompt("Enter your GitHub API token:");
  if (!token?.trim()) {
    console.error("No token provided. Aborted.");
    process.exit(1);
  }

  const config = await readConfig();
  config.tokens[key] = token.trim();
  await writeConfig(config);
  console.log(`Token saved for '${key}' in ${CONFIG_FILE}`);
}
