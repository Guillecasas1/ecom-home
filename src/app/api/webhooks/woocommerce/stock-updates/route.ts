import { NextRequest, NextResponse } from "next/server";

import crypto from "crypto";

import { processStockRestockEvent } from "@/modules/mailing/services/stock-notifications";
import { env } from "@/utils/env/server";

export async function POST (request: NextRequest) {
  const clonedRequest = request.clone();

  try {
    // Verificar firma del webhook
    const signature = request.headers.get("x-wc-webhook-signature");
    const rawBody = await clonedRequest.text();

    if (!validateWooCommerceSignature(signature, rawBody)) {
      console.warn("Invalid webhook signature for stock update");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await request.json();

    // Verificar que sea un evento de actualización de stock
    if (!data || !data.product_id || typeof data.stock_quantity === 'undefined') {
      return NextResponse.json({
        status: "ignored",
        reason: "Not a valid stock update event",
      });
    }

    // Obtener los datos relevantes
    const productId = parseInt(data.product_id, 10);
    const productSku = data.sku || '';
    const variant = data.variation ? `${data.attributes?.join(', ')}` : null;
    const quantity = parseInt(data.stock_quantity, 10);

    // Solo procesamos si hay stock disponible
    if (quantity > 0) {
      // Procesar el evento de reposición de stock
      const result = await processStockRestockEvent({
        productId,
        productSku,
        variant: variant !== null ? variant : undefined,
        quantity,
        metadata: {
          productName: data.name,
          price: data.price,
          productUrl: data.permalink,
          imageUrl: data.images?.[0]?.src,
        },
      });

      if (!result.success) {
        console.error("Error processing stock restock event", {
          error: result.error,
          productId
        });
        return NextResponse.json({ error: result.error }, { status: 200 });
      }

      return NextResponse.json({
        success: true,
        message: "Stock restock event processed",
        notificationsSent: result.notificationsSent,
      });
    } else {
      // Registrar evento de falta de stock sin enviar notificaciones
      await processStockRestockEvent({
        productId,
        productSku,
        variant: variant !== null ? variant : undefined,
        quantity: 0,
        metadata: {
          eventType: "out_of_stock",
          productName: data.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Out of stock event recorded",
        notificationsSent: 0,
      });
    }
  } catch (error) {
    console.error("Error processing WooCommerce stock webhook:", error);
    return NextResponse.json({
      success: false,
      message: "Error processing webhook",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}

// Función para validar la firma del webhook
function validateWooCommerceSignature (
  signature: string | null,
  payload: string
): boolean {
  if (!signature) {
    console.warn("Missing webhook signature or secret");
    return false;
  }

  try {
    const hmac = crypto.createHmac(
      "sha256",
      env.WOOCOMMERCE_WEBHOOK_SECRET
    );
    const calculatedSignature = hmac.update(payload).digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error("Error validating webhook signature", { error });
    return false;
  }
}