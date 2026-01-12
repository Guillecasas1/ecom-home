import { NextResponse } from "next/server";

import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { products, shippingMethods, wcOrderItems, wcOrders } from "@/db/schema";
import { WoocommerceLineItem, WoocommerceOrder } from "@/types/woocommerce";
import { env } from "@/utils/env/server";

export async function POST (request: Request) {
  const clonedRequest = request.clone();
  const webhookId = crypto.randomUUID().slice(0, 8);

  try {
    // DEBUG: Log all headers to see what WooCommerce is sending
    console.log(`[WEBHOOK:${webhookId}] Headers received:`, Object.fromEntries(request.headers.entries()));

    // Verificar firma del webhook
    const signature = request.headers.get("x-wc-webhook-signature");
    const rawBody = await clonedRequest.text();

    if (!validateWooCommerceSignature(signature, rawBody)) {
      console.warn(`[WEBHOOK:${webhookId}] Invalid webhook signature`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = (await request.json()) as WoocommerceOrder;

    console.info(`[WEBHOOK:${webhookId}] WooCommerce order received`, {
      orderId: data.id,
      orderNumber: data.number,
      status: data.status,
      total: data.total,
      timestamp: new Date().toISOString(),
    });

    // Procesar el pedido
    const result = await processOrder(data, webhookId);

    if (!result.success) {
      console.error(`[WEBHOOK:${webhookId}] Failed to process order`, {
        orderId: data.id,
        error: result.error,
      });
      return NextResponse.json({ error: result.error }, { status: 200 });
    }

    console.info(`[WEBHOOK:${webhookId}] Order processed successfully`, {
      orderId: data.id,
      dbOrderId: result.orderId,
      itemsCount: result.itemsCount,
      itemsWithoutCost: result.itemsWithoutCost,
    });

    return NextResponse.json({
      success: true,
      message: "Order processed",
      details: {
        orderId: result.orderId,
        itemsCount: result.itemsCount,
        itemsWithoutCost: result.itemsWithoutCost,
      },
    });
  } catch (error) {
    console.error(`[WEBHOOK:${webhookId}] Error processing order webhook`, {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ message: "Error" }, { status: 200 });
  }
}

function validateWooCommerceSignature (signature: string | null, payload: string): boolean {
  // DEBUG
  console.log("Secret length:", env.WOOCOMMERCE_WEBHOOK_SECRET.length);
  console.log("Secret value:", JSON.stringify(env.WOOCOMMERCE_WEBHOOK_SECRET));
  console.log("Signature received:", signature);

  if (!signature) {
    console.warn("Missing webhook signature");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", env.WOOCOMMERCE_WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(payload).digest("base64");

    // DEBUG
    console.log("Calculated signature:", calculatedSignature);
    console.log("Signatures match:", signature === calculatedSignature);

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
  } catch (error) {
    console.error("Error validating webhook signature", { error });
    return false;
  }
}

async function processOrder (
  data: WoocommerceOrder,
  webhookId: string
): Promise<{
  success: boolean;
  orderId?: number;
  itemsCount?: number;
  itemsWithoutCost?: number;
  error?: string;
}> {
  try {
    // Verificar si el pedido ya existe
    const [existingOrder] = await db
      .select()
      .from(wcOrders)
      .where(eq(wcOrders.wcOrderId, data.id))
      .limit(1);

    if (existingOrder) {
      console.info(`[WEBHOOK:${webhookId}] Order already exists, updating`, {
        orderId: data.id,
        dbOrderId: existingOrder.id,
      });

      // Actualizar el estado del pedido
      await db
        .update(wcOrders)
        .set({
          status: data.status,
          total: data.total,
          shippingTotal: data.shipping_total,
          updatedAt: new Date(),
        })
        .where(eq(wcOrders.id, existingOrder.id));

      return {
        success: true,
        orderId: existingOrder.id,
        itemsCount: 0,
        itemsWithoutCost: 0,
      };
    }

    // Procesar método de envío
    let shippingMethodId: number | null = null;
    let shippingMethodTitle: string | null = null;
    let wcShippingMethodId: string | null = null;

    if (data.shipping_lines && data.shipping_lines.length > 0) {
      const shippingLine = data.shipping_lines[0];
      shippingMethodTitle = shippingLine.method_title;
      wcShippingMethodId = shippingLine.method_id;

      // Buscar o crear el método de envío
      const shippingResult = await findOrCreateShippingMethod(shippingLine.method_id, shippingLine.method_title);
      shippingMethodId = shippingResult.id;
    }

    // Crear el pedido
    const [newOrder] = await db
      .insert(wcOrders)
      .values({
        wcOrderId: data.id,
        orderNumber: data.number,
        status: data.status,
        total: data.total,
        shippingTotal: data.shipping_total,
        shippingMethodId,
        shippingMethodTitle,
        wcShippingMethodId,
        customerEmail: data.billing.email,
        customerName: `${data.billing.first_name} ${data.billing.last_name}`.trim(),
        orderDate: new Date(data.date_created),
      })
      .returning({ id: wcOrders.id });

    // Procesar los items del pedido
    let itemsWithoutCost = 0;

    for (const item of data.line_items) {
      const productResult = await findOrCreateProduct(item);

      // Calcular costes si el producto tiene coste asignado
      let unitCost: string | null = null;
      let totalCost: string | null = null;

      if (productResult.currentCost) {
        unitCost = productResult.currentCost;
        totalCost = (parseFloat(productResult.currentCost) * item.quantity).toFixed(2);
      } else {
        itemsWithoutCost++;
      }

      await db.insert(wcOrderItems).values({
        orderId: newOrder.id,
        productId: productResult.id,
        wcProductId: item.product_id,
        wcVariationId: item.variation_id || null,
        name: item.name,
        sku: item.sku || null,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: item.total,
        unitCost,
        totalCost,
      });
    }

    return {
      success: true,
      orderId: newOrder.id,
      itemsCount: data.line_items.length,
      itemsWithoutCost,
    };
  } catch (error) {
    console.error("Error processing order", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function findOrCreateShippingMethod (
  methodId: string,
  methodTitle: string
): Promise<{ id: number; cost: string | null }> {
  // Buscar método existente
  const [existingMethod] = await db
    .select()
    .from(shippingMethods)
    .where(eq(shippingMethods.wcMethodId, methodId))
    .limit(1);

  if (existingMethod) {
    return { id: existingMethod.id, cost: existingMethod.cost };
  }

  // Detectar proveedor basándose en el method_id o nombre
  let provider = "otro";
  const lowerMethodId = methodId.toLowerCase();
  const lowerTitle = methodTitle.toLowerCase();

  if (lowerMethodId.includes("nacex") || lowerTitle.includes("nacex")) {
    provider = "nacex";
  } else if (
    lowerMethodId.includes("correos") ||
    lowerTitle.includes("correos") ||
    lowerMethodId.includes("postal") ||
    lowerTitle.includes("postal")
  ) {
    provider = "correos";
  }

  // Crear nuevo método de envío
  const [newMethod] = await db
    .insert(shippingMethods)
    .values({
      wcMethodId: methodId,
      name: methodTitle,
      provider,
      cost: null, // Sin coste asignado inicialmente
    })
    .returning({ id: shippingMethods.id, cost: shippingMethods.cost });

  return { id: newMethod.id, cost: newMethod.cost };
}

async function findOrCreateProduct (
  item: WoocommerceLineItem
): Promise<{ id: number; currentCost: string | null }> {
  const variationId = item.variation_id || null;

  // Buscar producto existente
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(
      variationId
        ? and(
          eq(products.wcProductId, item.product_id),
          eq(products.wcVariationId, variationId)
        )
        : and(
          eq(products.wcProductId, item.product_id),
          isNull(products.wcVariationId)
        )
    )
    .limit(1);

  if (existingProduct) {
    return { id: existingProduct.id, currentCost: existingProduct.currentCost };
  }

  // Crear nuevo producto sin coste
  const [newProduct] = await db
    .insert(products)
    .values({
      wcProductId: item.product_id,
      wcVariationId: variationId,
      sku: item.sku || null,
      name: item.name,
      currentCost: null, // Sin coste asignado inicialmente
    })
    .returning({ id: products.id, currentCost: products.currentCost });

  return { id: newProduct.id, currentCost: newProduct.currentCost };
}
