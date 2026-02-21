import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONFIG_DIR } from './config.ts';

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
    const parsed = JSON.parse(data) as unknown;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as MessagesStore).messages)) {
      return [];
    }

    return (parsed as MessagesStore).messages;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
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
  if (index < 0 || index >= messages.length) return;
  messages.splice(index, 1);
  await writeMessages(messages);
}
