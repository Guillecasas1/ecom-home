// app/api/stock-notifications/route.ts
import { NextRequest, NextResponse } from "next/server";

import crypto from "crypto";
import { z } from "zod";

import { createStockNotification } from "@/modules/mailing/services/stock-notifications";
import { env } from "@/utils/env/server";

// Esquema para validar las solicitudes entrantes
const stockNotificationSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().optional(),
  productId: z.number().int().positive("ID de producto inválido"),
  productName: z.string().min(1, "Nombre de producto requerido"),
  productSku: z.string().min(1, "SKU de producto requerido"),
  variant: z.string().optional(),
  signature: z.string().optional(), // Para verificar webhooks de WooCommerce
});

export async function POST (request: NextRequest) {
  try {
    // Crear una copia del request para poder leerlo múltiples veces
    const clonedRequest = request.clone();
    const rawBody = await clonedRequest.text();

    let isWebhook = false;
    let validSignature = true;

    // Verificar si es un webhook de WooCommerce (tendrá la cabecera x-wc-webhook-signature)
    const signature = request.headers.get("x-wc-webhook-signature");
    if (signature) {
      isWebhook = true;
      validSignature = validateWooCommerceSignature(signature, rawBody);
    }

    // Si es un webhook y la firma no es válida, rechazar
    if (isWebhook && !validSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parsear el cuerpo de la solicitud
    const body = await request.json();

    // Validar con el esquema
    const result = stockNotificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, name, productId, productName, productSku, variant } = result.data;

    // Crear la notificación en la base de datos
    const notificationResult = await createStockNotification({
      email,
      firstName: name,
      productId,
      productName,
      productSku,
      variant,
      metadata: {
        source: isWebhook ? "woocommerce_webhook" : "website_form",
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

// Función para validar la firma del webhook de WooCommerce
function validateWooCommerceSignature (signature: string | null, payload: string): boolean {
  if (!signature) {
    console.warn("Missing webhook signature or secret");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", env.WOOCOMMERCE_WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(payload).digest("base64");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
  } catch (error) {
    console.error("Error validating webhook signature", { error });
    return false;
  }
}