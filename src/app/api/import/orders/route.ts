import { NextResponse } from "next/server";

import { parse } from "csv-parse/sync";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { products, shippingMethods, wcOrderItems, wcOrders } from "@/db/schema";

// Función para generar un ID numérico único a partir del SKU
function hashCode (str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Asegurar que sea positivo y razonable
  return Math.abs(hash) % 2147483647;
}

// Estructura del CSV en español (como lo exporta WooCommerce)
interface CsvRowRaw {
  // Campos en español
  "Número de pedido"?: string;
  "Estado del pedido"?: string;
  "Fecha del pedido"?: string;
  "Nombre (facturación)"?: string;
  "Apellidos (facturación)"?: string;
  "Correo electrónico (facturación)"?: string;
  "Título del método de envío"?: string;
  "Importe de envío del pedido"?: string;
  "Importe total del pedido"?: string;
  "SKU"?: string;
  "Artículo #"?: string;
  "Nombre del artículo"?: string;
  "Cantidad (- reembolso)"?: string;
  "Coste de artículo"?: string;
  "Total del artículo"?: string;
  "ID de la variación"?: string;
  // Campos en inglés (alternativa)
  order_id?: string;
  order_number?: string;
  status?: string;
  order_date?: string;
  total?: string;
  shipping_total?: string;
  shipping_method?: string;
  customer_email?: string;
  customer_name?: string;
  product_id?: string;
  variation_id?: string;
  product_name?: string;
  sku?: string;
  quantity?: string;
  unit_price?: string;
  unit_cost?: string;
  line_total?: string;
  [key: string]: string | undefined;
}

// Estructura normalizada
interface CsvRow {
  order_id: string;
  order_number: string;
  status: string;
  order_date: string;
  total: string;
  shipping_total: string;
  shipping_method: string;
  customer_email: string;
  customer_name: string;
  product_id: string;
  variation_id: string;
  product_name: string;
  sku: string;
  quantity: string;
  unit_price_without_vat: string; // Precio de venta SIN IVA ("Coste de artículo" en el CSV es engañoso)
  line_total: string;
}

/**
 * Parsea un número en formato español (con coma decimal) a número JS
 * Ejemplos: "2,89" → 2.89, "46,5" → 46.5, "1.234,56" → 1234.56
 */
function parseSpanishNumber (value: string | undefined | null): number {
  if (!value) return 0;

  // Limpiar el string
  let cleaned = value.toString().trim();

  // Quitar comillas si las tiene
  cleaned = cleaned.replace(/^["']|["']$/g, '');

  // Si está vacío después de limpiar
  if (!cleaned) return 0;

  // Detectar formato español: tiene coma como decimal
  // Formato español: 1.234,56 (punto = miles, coma = decimal)
  // Formato inglés: 1,234.56 (coma = miles, punto = decimal)

  if (cleaned.includes(',')) {
    // Verificar si es formato español (coma como decimal)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Formato español: la coma está después del punto (o no hay punto)
      // Quitar puntos de miles y reemplazar coma por punto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato inglés: el punto está después de la coma
      // Quitar comas de miles
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convierte un número a string con 2 decimales para guardar en BD
 */
function toDecimalString (value: number): string {
  return value.toFixed(2);
}

// Normalizar una fila del CSV (español → inglés)
function normalizeRow (raw: CsvRowRaw): CsvRow {
  const firstName = raw["Nombre (facturación)"] || "";
  const lastName = raw["Apellidos (facturación)"] || "";
  const customerName = raw.customer_name || `${firstName} ${lastName}`.trim();

  return {
    order_id: raw["Número de pedido"] || raw.order_id || "",
    order_number: raw["Número de pedido"] || raw.order_number || "",
    status: normalizeStatus(raw["Estado del pedido"] || raw.status || "completed"),
    order_date: raw["Fecha del pedido"] || raw.order_date || "",
    total: raw["Importe total del pedido"] || raw.total || "0",
    shipping_total: raw["Importe de envío del pedido"] || raw.shipping_total || "0",
    shipping_method: raw["Título del método de envío"] || raw.shipping_method || "",
    customer_email: raw["Correo electrónico (facturación)"] || raw.customer_email || "",
    customer_name: customerName,
    product_id: raw["Artículo #"] || raw.product_id || "",
    variation_id: raw["ID de la variación"] || raw.variation_id || "",
    product_name: raw["Nombre del artículo"] || raw.product_name || "",
    sku: raw["SKU"] || raw.sku || "",
    quantity: raw["Cantidad (- reembolso)"] || raw.quantity || "1",
    // NOTA: "Coste de artículo" es en realidad el precio de venta SIN IVA
    unit_price_without_vat: raw["Coste de artículo"] || raw.unit_cost || raw.unit_price || "0",
    line_total: raw["Total del artículo"] || raw.line_total || "",
  };
}

/**
 * Normaliza el estado del pedido (español → inglés)
 */
function normalizeStatus (status: string): string {
  const statusMap: Record<string, string> = {
    "completado": "completed",
    "procesando": "processing",
    "pendiente": "pending",
    "cancelado": "cancelled",
    "reembolsado": "refunded",
    "fallido": "failed",
    "en espera": "on-hold",
  };

  const normalized = status.toLowerCase().trim();
  return statusMap[normalized] || normalized;
}

export async function POST (request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();

    // Parsear CSV
    const rawRecords: CsvRowRaw[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    // Normalizar las filas (español → inglés)
    const records: CsvRow[] = rawRecords.map(normalizeRow);

    console.log(`[IMPORT] Starting import of ${records.length} rows`);
    if (records[0]) {
      console.log(`[IMPORT] First row sample:`, {
        order_id: records[0].order_id,
        total: records[0].total,
        shipping_total: records[0].shipping_total,
        unit_price_without_vat: records[0].unit_price_without_vat,
        quantity: records[0].quantity,
      });
      console.log(`[IMPORT] Parsed values:`, {
        total: parseSpanishNumber(records[0].total),
        shipping_total: parseSpanishNumber(records[0].shipping_total),
        unit_price_without_vat: parseSpanishNumber(records[0].unit_price_without_vat),
        quantity: parseSpanishNumber(records[0].quantity),
      });
    }

    // Agrupar filas por order_id
    const orderGroups = new Map<string, CsvRow[]>();
    for (const row of records) {
      const orderId = row.order_id;
      if (!orderId) {
        console.warn("[IMPORT] Row without order_id, skipping");
        continue;
      }
      if (!orderGroups.has(orderId)) {
        orderGroups.set(orderId, []);
      }
      orderGroups.get(orderId)!.push(row);
    }

    console.log(`[IMPORT] Found ${orderGroups.size} unique orders`);

    let ordersCreated = 0;
    let ordersSkipped = 0;
    let itemsCreated = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    const errors: string[] = [];

    for (const [wcOrderId, orderRows] of orderGroups) {
      try {
        const firstRow = orderRows[0];
        const wcOrderIdNum = parseInt(wcOrderId);

        if (isNaN(wcOrderIdNum)) {
          errors.push(`Invalid order ID: ${wcOrderId}`);
          continue;
        }

        // Procesar método de envío
        let shippingMethodId: number | null = null;
        const shippingMethodTitle = firstRow.shipping_method || null;

        if (shippingMethodTitle) {
          const shippingResult = await findOrCreateShippingMethod(shippingMethodTitle);
          shippingMethodId = shippingResult.id;
        }

        // Parsear valores numéricos con formato español
        const totalValue = parseSpanishNumber(firstRow.total);
        // El envío viene SIN IVA, hay que añadirlo (21%)
        const shippingTotalValue = parseSpanishNumber(firstRow.shipping_total) * 1.21;

        // Crear el pedido (con onConflictDoNothing para evitar errores de duplicados)
        const insertResult = await db
          .insert(wcOrders)
          .values({
            wcOrderId: wcOrderIdNum,
            orderNumber: firstRow.order_number || wcOrderId,
            status: firstRow.status || "completed",
            total: toDecimalString(totalValue),
            shippingTotal: toDecimalString(shippingTotalValue),
            shippingMethodId,
            shippingMethodTitle,
            customerEmail: firstRow.customer_email || null,
            customerName: firstRow.customer_name || null,
            orderDate: parseDate(firstRow.order_date),
          })
          .onConflictDoNothing({ target: wcOrders.wcOrderId })
          .returning({ id: wcOrders.id });

        // Si no se insertó (ya existía), saltar
        if (insertResult.length === 0) {
          ordersSkipped++;
          continue;
        }

        const newOrder = insertResult[0];
        ordersCreated++;

        // Crear los items del pedido
        for (const row of orderRows) {
          // IMPORTANTE: "Artículo #" en el CSV es el número de línea, NO el ID del producto
          // Usamos el SKU como identificador único del producto
          const sku = row.sku?.trim();

          if (!sku) {
            console.warn(`[IMPORT] Order ${wcOrderId}: Skipping item without SKU`);
            continue; // Saltar filas sin SKU
          }

          // Generar un wcProductId basado en el hash del SKU (para compatibilidad)
          const wcProductId = hashCode(sku);
          const wcVariationId = row.variation_id && parseInt(row.variation_id) !== 0
            ? parseInt(row.variation_id)
            : null;

          // Parsear valores numéricos
          const quantity = Math.max(1, Math.round(parseSpanishNumber(row.quantity)));
          // "Coste de artículo" es en realidad el PRECIO DE VENTA sin IVA - añadir 21%
          const unitPriceWithoutVat = parseSpanishNumber(row.unit_price_without_vat);
          const unitPrice = unitPriceWithoutVat * 1.21; // Precio con IVA

          // Buscar o crear el producto (SIN coste, porque no tenemos esa info en el CSV)
          const productResult = await findOrCreateProduct({
            wcProductId,
            wcVariationId,
            name: row.product_name,
            sku,
            cost: null, // El CSV no tiene el coste real del producto
          });

          if (productResult.isNew) {
            productsCreated++;
          } else if (productResult.costUpdated) {
            productsUpdated++;
          }

          // Calcular el precio de venta total
          let totalPrice = unitPrice * quantity;

          // Si tenemos line_total en el CSV, usarlo (también añadir IVA)
          if (row.line_total) {
            const lineTotalWithoutVat = parseSpanishNumber(row.line_total);
            totalPrice = lineTotalWithoutVat * 1.21;
          }

          // No tenemos coste real del producto en el CSV
          const totalCost = 0;

          await db.insert(wcOrderItems).values({
            orderId: newOrder.id,
            productId: productResult.id,
            wcProductId,
            wcVariationId,
            name: row.product_name,
            sku: row.sku || null,
            quantity,
            unitPrice: toDecimalString(unitPrice),
            totalPrice: toDecimalString(totalPrice),
            unitCost: null, // No tenemos coste real del producto en el CSV
            totalCost: null,
          });

          itemsCreated++;
        }
      } catch (error) {
        const errorMsg = `Error processing order ${wcOrderId}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`[IMPORT] Complete: ${ordersCreated} orders created, ${ordersSkipped} skipped, ${itemsCreated} items, ${productsCreated} new products, ${productsUpdated} products updated with cost`);

    return NextResponse.json({
      success: true,
      summary: {
        ordersCreated,
        ordersSkipped,
        itemsCreated,
        productsCreated,
        productsUpdated,
        totalRowsProcessed: records.length,
        errors: errors.slice(0, 10), // Solo los primeros 10 errores
      },
    });
  } catch (error) {
    console.error("[IMPORT] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function parseDate (dateStr: string): Date {
  if (!dateStr) {
    return new Date();
  }

  // Formato: "2025-12-31 16:51" (ISO-like)
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hour, min] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
  }

  // Intentar parseo directo
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Formato DD/MM/YYYY HH:mm:ss
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?:?(\d{2})?/);
  if (parts) {
    const [, day, month, year, hour = "0", min = "0", sec = "0"] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
  }

  return new Date();
}

async function findOrCreateShippingMethod (methodTitle: string): Promise<{ id: number }> {
  // Buscar método existente por nombre
  const [existingMethod] = await db
    .select()
    .from(shippingMethods)
    .where(eq(shippingMethods.name, methodTitle))
    .limit(1);

  if (existingMethod) {
    return { id: existingMethod.id };
  }

  // Detectar proveedor
  let provider = "otro";
  const lowerTitle = methodTitle.toLowerCase();

  if (lowerTitle.includes("nacex")) {
    provider = "nacex";
  } else if (lowerTitle.includes("correos") || lowerTitle.includes("postal")) {
    provider = "correos";
  }

  // Crear nuevo método de envío
  const [newMethod] = await db
    .insert(shippingMethods)
    .values({
      wcMethodId: `imported_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: methodTitle,
      provider,
      cost: null,
    })
    .returning({ id: shippingMethods.id });

  return { id: newMethod.id };
}

async function findOrCreateProduct (data: {
  wcProductId: number;
  wcVariationId: number | null;
  name: string;
  sku: string | null;
  cost: number | null;
}): Promise<{ id: number; isNew: boolean; costUpdated: boolean }> {
  // Buscar producto por SKU (identificador único preferido)
  if (data.sku) {
    const [existingProductBySku] = await db
      .select()
      .from(products)
      .where(eq(products.sku, data.sku))
      .limit(1);

    if (existingProductBySku) {
      // Si el producto existe pero no tiene coste y tenemos uno, actualizarlo
      if (data.cost !== null && existingProductBySku.currentCost === null) {
        await db
          .update(products)
          .set({
            currentCost: toDecimalString(data.cost),
            costUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(products.id, existingProductBySku.id));

        return { id: existingProductBySku.id, isNew: false, costUpdated: true };
      }
      return { id: existingProductBySku.id, isNew: false, costUpdated: false };
    }
  }

  // Fallback: buscar por wcProductId + wcVariationId (para productos sin SKU)
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(
      data.wcVariationId
        ? and(
          eq(products.wcProductId, data.wcProductId),
          eq(products.wcVariationId, data.wcVariationId)
        )
        : and(
          eq(products.wcProductId, data.wcProductId),
          isNull(products.wcVariationId)
        )
    )
    .limit(1);

  if (existingProduct) {
    // Si el producto existe pero no tiene coste y tenemos uno, actualizarlo
    if (data.cost !== null && existingProduct.currentCost === null) {
      await db
        .update(products)
        .set({
          currentCost: toDecimalString(data.cost),
          costUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, existingProduct.id));

      return { id: existingProduct.id, isNew: false, costUpdated: true };
    }
    return { id: existingProduct.id, isNew: false, costUpdated: false };
  }

  // Crear nuevo producto con coste si lo tenemos
  const [newProduct] = await db
    .insert(products)
    .values({
      wcProductId: data.wcProductId,
      wcVariationId: data.wcVariationId,
      sku: data.sku,
      name: data.name,
      currentCost: data.cost !== null ? toDecimalString(data.cost) : null,
      costUpdatedAt: data.cost !== null ? new Date() : null,
    })
    .returning({ id: products.id });

  return { id: newProduct.id, isNew: true, costUpdated: false };
}