import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.config', 'llm-coding-toolkit');
const MESSAGES_FILE = join(CONFIG_DIR, 'messages.json');

export interface Message {
  name: string;
  template: string;
}

interface MessagesStore {
  messages: Message[];
}

export async function readMessages(): Promise<Message[]> {
  try {
    const data = await readFile(MESSAGES_FILE, 'utf-8');
    const store = JSON.parse(data) as MessagesStore;
    return store.messages;
  } catch {
    return [];
  }
}

async function writeMessages(messages: Message[]): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const store: MessagesStore = { messages };
  await writeFile(MESSAGES_FILE, JSON.stringify(store, null, 2), { mode: 0o600 });
}

export async function addMessage(name: string, template: string): Promise<void> {
  const messages = await readMessages();
  messages.push({ name, template });
  await writeMessages(messages);
}

export async function updateMessage(index: number, template: string): Promise<void> {
  const messages = await readMessages();
  const msg = messages[index];
  if (!msg) return;
  msg.template = template;
  await writeMessages(messages);
}

export async function removeMessage(index: number): Promise<void> {
  const messages = await readMessages();
  messages.splice(index, 1);
  await writeMessages(messages);
}
