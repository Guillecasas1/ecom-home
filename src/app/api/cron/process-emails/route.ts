import { NextRequest, NextResponse } from "next/server";

import { processScheduledEmails } from "@/lib/services/email-scheduler";
import { env } from "@/utils/env/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.info("Email processing CRON job started");

  try {
    // Verificar clave de seguridad para evitar ejecuciones no autorizadas
    const apiKey = request.headers.get("x-api-key");

    if (!env.CRON_API_KEY) {
      console.error("CRON_API_KEY environment variable not set");
      return NextResponse.json(
        {
          error: "Server configuration error",
          hint: "CRON_API_KEY environment variable not set",
        },
        { status: 500 }
      );
    }

    if (apiKey !== env.CRON_API_KEY) {
      console.warn("Unauthorized CRON job attempt", {
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Procesar los emails programados con manejo de errores
    const results = await processScheduledEmails();

    const duration = Date.now() - startTime;
    console.info("Email processing CRON job completed", {
      ...results,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      processed: results,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Email processing CRON job failed", {
      error,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
