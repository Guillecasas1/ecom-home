import { NextRequest, NextResponse } from "next/server";

import { processScheduledEmails } from "@/modules/mailing/services/email-scheduler";
import { env } from "@/utils/env/server";

export async function GET (request: NextRequest) {
  const startTime = Date.now();
  const cronId = crypto.randomUUID().slice(0, 8); // ID único para esta ejecución del CRON

  console.info(`[CRON:${cronId}] Email processing CRON job started`, {
    timestamp: new Date().toISOString(),
    ip: request.headers.get("x-forwarded-for") || "unknown",
  });

  try {
    // Verificar clave de seguridad para evitar ejecuciones no autorizadas
    const apiKey = request.headers.get("x-api-key");

    if (!env.CRON_API_KEY) {
      console.error(`[CRON:${cronId}] CRON_API_KEY environment variable not set`);
      return NextResponse.json(
        {
          error: "Server configuration error",
          hint: "CRON_API_KEY environment variable not set",
        },
        { status: 500 }
      );
    }

    if (apiKey !== env.CRON_API_KEY) {
      console.warn(`[CRON:${cronId}] Unauthorized CRON job attempt`, {
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Procesar los emails programados con manejo de errores
    const results = await processScheduledEmails();

    const duration = Date.now() - startTime;
    console.info(`[CRON:${cronId}] Email processing CRON job completed`, {
      ...results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      cronId,
      processed: results,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[CRON:${cronId}] Email processing CRON job failed`, {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        cronId,
        message: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
