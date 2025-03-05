import { createEnv } from "@t3-oss/env-nextjs";
import { ZodError, z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]),
    SUPABASE_DATABASE_URL: z.string(),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    CRON_API_KEY: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string(),
    SMTP_SECURE: z.string(),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),
    WOOCOMMERCE_WEBHOOK_SECRET: z.string(),
  },
  onValidationError: (error: ZodError) => {
    console.error(
      "❌ Invalid environment variables:",
      error.flatten().fieldErrors
    );
    process.exit(1);
  },
  emptyStringAsUndefined: true,
  // eslint-disable-next-line n/no-process-env
  experimental__runtimeEnv: process.env,
});
