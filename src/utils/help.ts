import pc from 'picocolors';

export interface HelpOption {
  flag: string; // e.g. '-r, --repo'
  arg?: string; // e.g. '<owner/repo>'
  description: string;
}

export interface CommandHelp {
  command: string;
  usage?: string; // usage hint after the command, e.g. '[options]' or '[subcommand]'
  description: string;
  subcommands?: Record<string, string>;
  options?: HelpOption[];
  footer?: string;
}

const HELP_OPTION: HelpOption = { flag: '-h, --help', description: 'Show this help message' };

const labelOf = (option: HelpOption) => (option.arg ? `${option.flag} ${option.arg}` : option.flag);

export function printCommandHelp({ command, usage, description, subcommands, options = [], footer }: CommandHelp) {
  const allOptions = [...options, HELP_OPTION];
  const width = Math.max(
    ...allOptions.map((option) => labelOf(option).length),
    ...Object.keys(subcommands ?? {}).map((name) => name.length),
  );

  const lines = [`Usage: ${pc.bold(`llmct ${command}`)}${usage ? ` ${pc.dim(usage)}` : ''}`, '', description];

  if (subcommands) {
    lines.push('', 'Subcommands:');
    for (const [name, desc] of Object.entries(subcommands)) {
      lines.push(`  ${pc.bold(name.padEnd(width))}  ${pc.dim(desc)}`);
    }
  }

  lines.push('', 'Options:');
  for (const option of allOptions) {
    const padding = ' '.repeat(width - labelOf(option).length);
    const label = option.arg ? `${pc.bold(option.flag)} ${pc.dim(option.arg)}` : pc.bold(option.flag);
    lines.push(`  ${label}${padding}  ${pc.dim(option.description)}`);
  }

  if (footer) {
    lines.push('', pc.dim(footer));
  }

  console.log(lines.join('\n'));
}
