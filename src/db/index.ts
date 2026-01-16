import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/utils/env/server";

// Configurar el cliente con límite de conexiones para serverless
const client = postgres(env.SUPABASE_DATABASE_URL, {
  max: 1, // Limitar a 1 conexión por instancia serverless
  idle_timeout: 20, // Cerrar conexiones inactivas después de 20 segundos
  connect_timeout: 10, // Timeout de conexión de 10 segundos
});

export const db = drizzle({ client });
