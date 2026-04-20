import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().default("precozap-secret-dev"),
  ANTHROPIC_API_KEY: z.string().optional(),
  CACHE_TTL_PRODUCTS: z.string().default("300"),
  CACHE_TTL_SEARCH: z.string().default("60"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  jwtSecret: parsed.data.JWT_SECRET,
  anthropicApiKey: parsed.data.ANTHROPIC_API_KEY,
  cache: {
    ttlProducts: parseInt(parsed.data.CACHE_TTL_PRODUCTS, 10),
    ttlSearch: parseInt(parsed.data.CACHE_TTL_SEARCH, 10),
  },
  frontendUrl: parsed.data.FRONTEND_URL,
  isDev: parsed.data.NODE_ENV === "development",
  isProd: parsed.data.NODE_ENV === "production",
};
