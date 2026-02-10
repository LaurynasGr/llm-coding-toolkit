import { z } from "zod";

const envSchema = z.object({
  GITHUB_TOKENS: z.string().transform((val) => val.split(",").map((token) => token.trim())),
});

export const env = envSchema.parse(process.env);
