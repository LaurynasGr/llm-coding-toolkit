import { readConfig } from "../config.ts";

export async function listTokens() {
  const config = await readConfig();
  const owners = Object.keys(config.tokens);
  if (owners.length === 0) {
    console.log("No tokens configured. Run: llm-toolkit add-token");
    return;
  }
  console.log("Configured tokens:");
  for (const owner of owners) {
    const token = config.tokens[owner]!;
    const masked = token.slice(0, 4) + "·····" + token.slice(-4);
    console.log(`  ${owner}: ${masked}`);
  }
}
