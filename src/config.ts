import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const CONFIG_DIR = join(homedir(), '.config', 'llm-coding-toolkit');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface Config {
  tokens: Record<string, string>; // owner/org -> token
}

export async function readConfig(): Promise<Config> {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as Config;
  } catch {
    return { tokens: {} };
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export interface TokenEntry {
  label: string; // owner/org the token is stored under, or 'default'
  token: string;
}

export async function getTokenEntryForOwner(owner: string): Promise<TokenEntry | null> {
  const config = await readConfig();
  const ownerToken = config.tokens[owner];
  if (ownerToken) return { label: owner, token: ownerToken };
  const defaultToken = config.tokens['default'];
  if (defaultToken) return { label: 'default', token: defaultToken };
  return null;
}

export async function getTokenForOwner(owner: string): Promise<string | null> {
  const entry = await getTokenEntryForOwner(owner);
  return entry?.token ?? null;
}

export async function hasAnyToken(): Promise<boolean> {
  const config = await readConfig();
  return Object.keys(config.tokens).length > 0;
}
