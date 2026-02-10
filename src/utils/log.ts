import { log as clackLog } from '@clack/prompts';

function normalize(msg: string | string[]): string {
  return Array.isArray(msg) ? msg.join('\n') : msg;
}

export const log = {
  message: (msg: string | string[]) => clackLog.message(normalize(msg)),
  info: (msg: string | string[]) => clackLog.info(normalize(msg)),
  success: (msg: string | string[]) => clackLog.success(normalize(msg)),
  step: (msg: string | string[]) => clackLog.step(normalize(msg)),
  warn: (msg: string | string[]) => clackLog.warn(normalize(msg)),
  error: (msg: string | string[]) => clackLog.error(normalize(msg)),
};
