import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RPC_URL: z.string().url().min(1),
  FALLBACK_RPC_URL: z.string().url().optional(),
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key format"),
  CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RECORD_ENDPOINT: z.string().url().optional(),
  DEFAULT_TX_GAS: z.coerce.bigint().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
