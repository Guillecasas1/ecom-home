import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createStockNotification } from "@/modules/mailing/services/stock-notifications";

const stockNotificationSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  lastName: z.string().optional(),
  productId: z.number().int().positive("ID de producto inválido"),
  productName: z.string().min(1, "Nombre de producto requerido"),
  productSku: z.string().min(1, "SKU de producto requerido"),
  variant: z.string().optional(),
});

export async function POST (request: NextRequest) {
  try {
    // Parsear el cuerpo de la solicitud
    const body = await request.json();

    console.log("Stock notification event received", body);

    // Validar con el esquema
    const result = stockNotificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, name, lastName, productId, productName, productSku, variant } = result.data;

    // Crear la notificación en la base de datos
    const notificationResult = await createStockNotification({
      email,
      firstName: name || "",
      lastName: lastName || "",
      productId,
      productName,
      productSku,
      variant,
      metadata: {
        source: "woo_stock_notifications_plugin",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    if (!notificationResult.success) {
      return NextResponse.json(
        { error: notificationResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stock notification request received",
      notificationId: notificationResult.notificationId,
    });
  } catch (error) {
    console.error("Error processing stock notification request", { error });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
