import { NextRequest, NextResponse } from "next/server";

import { processStockRestockEvent } from "@/modules/mailing/services/stock-notifications";

interface StockUpdateEvent {
  product_id: number;
  product_name: string;
  sku: string;
  stock_quantity: number;
  stock_status: string;
  manage_stock: boolean;
  timestamp: string;
  product_url: string;
}

export async function POST (request: NextRequest) {
  try {
    // Verificar firma del webhook
    const signature = request.headers.get("x-wc-webhook-custom");

    if (!validateWooCommerceCustom(signature)) {
      console.warn("Invalid webhook signature for stock update");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = await request.json() as StockUpdateEvent;

    // Solo procesamos si hay stock disponible
    if (data.stock_quantity > 0) {
      // Procesar el evento de reposición de stock
      const result = await processStockRestockEvent({
        productId: data.product_id,
        productSku: data.sku,
        variant: undefined,
        quantity: data.stock_quantity,
        metadata: {
          productName: data.product_name,
          productUrl: data.product_url,
        },
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 200 });
      }

      console.log("Stock update event received", data);

      return NextResponse.json({
        success: true,
        message: "Stock restock event processed",
        notificationsSent: result.notificationsSent,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stock restock event processed (no stock available)",
      notificationsSent: false,
    });
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
function validateWooCommerceCustom (
  signature: string | null,
): boolean {
  if (!signature) {
    console.warn("Missing webhook signature or secret");
    return false;
  }

  if (signature !== "tQKx3xBFKEaAaQi") {
    return false;
  }

  return true;
}
