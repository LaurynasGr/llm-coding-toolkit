#!/usr/bin/env bun

const COMMANDS: Record<string, string> = {
  prs: "List open pull requests",
  "add-token": "Add a GitHub API token",
  "list-tokens": "List configured tokens",
};

function printUsage() {
  console.log(`Usage: llm-toolkit <command> [options]

Commands:`);
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(16)} ${desc}`);
  }
  console.log(`\nRun 'llm-toolkit <command> --help' for command-specific options.`);
}

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(0);
}

const commandArgs = process.argv.slice(3);

switch (command) {
  case "prs": {
    const { prs } = await import("./src/commands/prs.ts");
    await prs(commandArgs);
    break;
  }
  case "add-token": {
    const { addToken } = await import("./src/commands/add-token.ts");
    await addToken();
    break;
  }
  case "list-tokens": {
    const { listTokens } = await import("./src/commands/list-tokens.ts");
    await listTokens();
    break;
  }
  default:
    console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(1);
}
