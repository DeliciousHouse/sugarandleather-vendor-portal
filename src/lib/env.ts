import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  APP_URL: z.string().url("APP_URL must be a valid URL").default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  DISABLE_PORTAL_AUTH: z.enum(["true", "false"]).default("false"),
  DISABLE_PORTAL_AUTH_ADMIN_USER_ID: z.string().optional(),
  DISABLE_PORTAL_AUTH_PARTNER_USER_ID: z.string().optional(),
  DISABLE_PORTAL_AUTH_PARTNER_ID: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_NAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  AGREEMENT_PACKET_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("Invalid environment variables:", JSON.stringify(formatted, null, 2));
    throw new Error("Invalid environment variables. Check .env.example for required values.");
  }
  _env = result.data;
  return _env;
}

export function resetEnvCache() {
  _env = null;
}
