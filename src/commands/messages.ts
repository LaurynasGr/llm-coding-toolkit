import { intro, outro, text, select, isCancel, cancel } from '@clack/prompts';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { parseArgs } from 'node:util';
import pc from 'picocolors';
import { log } from '../utils/index.ts';
import { readMessages, addMessage, updateMessage, removeMessage } from '../messages.ts';
import type { Message } from '../messages.ts';
import { SUBCOMMANDS } from '../commands.ts';

const TEMPLATE_VAR_RE = /\{\{([^:}]+)(?::"([^"]*)")?\}\}/g;

function printHelp() {
  const subcommandLines = Object.entries(SUBCOMMANDS.messages)
    .map(([name, desc]) => `  ${pc.bold(name.padEnd(12))} ${pc.dim(desc)}`)
    .join('\n');

  console.log(`Usage: ${pc.bold('llmct messages')} ${pc.dim('[subcommand]')}

Pick a saved message, fill in variables, and copy to clipboard.

Subcommands:
${subcommandLines}

Options:
  ${pc.bold('-h, --help'.padEnd(12))} ${pc.dim('Show this help message')}

${pc.dim('Run without a subcommand to pick and use a message.')}`);
}

function openEditor(initialContent: string): string | null {
  const editor = process.env.EDITOR || 'vi';
  const dir = mkdtempSync(join(tmpdir(), 'llmct-'));
  const file = join(dir, 'message.txt');

  try {
    writeFileSync(file, initialContent, { mode: 0o600 });

    // Handle EDITOR values that include arguments (e.g. "code --wait")
    const result = /\s/.test(editor)
      ? spawnSync(editor + ' ' + JSON.stringify(file), { stdio: 'inherit', shell: true })
      : spawnSync(editor, [file], { stdio: 'inherit' });

    if (result.status !== 0) return null;

    const content = readFileSync(file, 'utf-8');
    return content;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function copyToClipboard(text: string): boolean {
  const plat = platform();
  try {
    if (plat === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (plat === 'linux') {
      // WSL detection
      try {
        execSync('clip.exe', { input: text });
      } catch {
        execSync('xclip -selection clipboard', { input: text });
      }
    } else if (plat === 'win32') {
      execSync('clip.exe', { input: text });
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parseTemplateVars(template: string) {
  const vars: Array<{ name: string; defaultValue: string | undefined }> = [];
  const indexByName = new Map<string, number>();
  TEMPLATE_VAR_RE.lastIndex = 0;
  let match;
  while ((match = TEMPLATE_VAR_RE.exec(template)) !== null) {
    const name = match[1]!.trim();
    const existingIndex = indexByName.get(name);
    if (existingIndex === undefined) {
      indexByName.set(name, vars.length);
      vars.push({ name, defaultValue: match[2] });
    } else if (vars[existingIndex]!.defaultValue === undefined && match[2] !== undefined) {
      vars[existingIndex]!.defaultValue = match[2];
    }
  }
  return vars;
}

function resolveTemplate(template: string, values: Record<string, string>): string {
  return template.replace(TEMPLATE_VAR_RE, (_, name: string) => {
    return values[name.trim()] ?? '';
  });
}

async function selectMessage(messages: Message[]): Promise<number | null> {
  if (messages.length === 0) {
    log.warn('No messages saved yet. Run `llmct messages add` to create one.');
    return null;
  }

  const choice = await select({
    message: 'Select a message',
    options: messages.map((m, i) => ({
      value: i,
      label: m.name,
      hint: m.template.length > 60 ? m.template.slice(0, 60) + '…' : m.template,
    })),
  });

  if (isCancel(choice)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  return choice;
}

async function handleAdd() {
  intro(pc.bold('Add Message'));

  const name = await text({
    message: 'Message name',
    placeholder: 'e.g. Review changes',
    validate: (value) => {
      if (!value?.trim()) return 'Name cannot be empty';
    },
  });

  if (isCancel(name)) {
    cancel('Cancelled.');
    process.exit(0);
  }

  log.info([
    'Your editor will open to compose the message template.',
    `Use ${pc.bold('{{VarName:"default"}}')} for variables (e.g. ${pc.dim('{{File:"main.ts"}}')}).`,
  ]);

  const template = openEditor('');

  if (template === null || template.trim() === '') {
    cancel('Empty message, nothing saved.');
    process.exit(0);
  }

  await addMessage(name.trim(), template.trimEnd());
  outro(pc.green(`Message "${name.trim()}" saved.`));
}

async function handleUpdate() {
  intro(pc.bold('Update Message'));

  const messages = await readMessages();
  const index = await selectMessage(messages);
  if (index === null) return;

  log.info('Your editor will open with the current template.');

  const msg = messages[index]!;
  const template = openEditor(msg.template);

  if (template === null || template.trim() === '') {
    cancel('Empty message, update cancelled.');
    process.exit(0);
  }

  await updateMessage(index, template.trimEnd());
  outro(pc.green(`Message "${msg.name}" updated.`));
}

async function handleRemove() {
  intro(pc.bold('Remove Message'));

  const messages = await readMessages();
  const index = await selectMessage(messages);
  if (index === null) return;

  const msg = messages[index]!;
  await removeMessage(index);
  outro(pc.green(`Message "${msg.name}" removed.`));
}

async function handlePick() {
  intro(pc.bold('Messages'));

  const messages = await readMessages();
  const index = await selectMessage(messages);
  if (index === null) return;

  const msg = messages[index]!;
  const vars = parseTemplateVars(msg.template);

  const values: Record<string, string> = {};
  for (const v of vars) {
    const answer = await text({
      message: v.name,
      placeholder: v.defaultValue ? `Press Enter for "${v.defaultValue}"` : undefined,
      defaultValue: v.defaultValue,
    });

    if (isCancel(answer)) {
      cancel('Cancelled.');
      process.exit(0);
    }

    values[v.name] = answer;
  }

  const resolved = resolveTemplate(msg.template, values);
  const copied = copyToClipboard(resolved);

  if (copied) {
    outro(pc.green('Copied to clipboard!'));
  } else {
    log.warn('Could not copy to clipboard. Here is the message:');
    log.message(resolved);
    outro('');
  }
}

export async function messages(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const subcommand = positionals[0];

  switch (subcommand) {
    case 'add':
      await handleAdd();
      break;
    case 'update':
      await handleUpdate();
      break;
    case 'remove':
      await handleRemove();
      break;
    default:
      await handlePick();
      break;
  }
}
