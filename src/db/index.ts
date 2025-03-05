import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/utils/env/server";

const connectionString = env.SUPABASE_DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
