import { defineConfig } from "drizzle-kit";

import { env } from "@/utils/env/server";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: env.SUPABASE_DATABASE_URL,
  },
});
