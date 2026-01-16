import { NextResponse } from "next/server";

import { parse } from "csv-parse/sync";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { products, wcOrderItems } from "@/db/schema";

interface CsvRow {
  sku: string;
  coste: string;
}

/**
 * Parsea un número con formato español (coma como separador decimal)
 */
function parseSpanishNumber (value: string): number {
  if (!value || value.trim() === "") return 0;

  let cleaned = value.trim();

  // Detectar formato español (coma como decimal)
  if (cleaned.includes(",")) {
    if (cleaned.includes(".") && cleaned.indexOf(".") < cleaned.indexOf(",")) {
      // Formato: 1.234,56 (español con miles)
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Formato: 1234,56 (español sin miles)
      cleaned = cleaned.replace(",", ".");
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
    const records: CsvRow[] = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    console.log(`[IMPORT COSTS] Starting import of ${records.length} rows`);

    let productsUpdated = 0;
    let productsNotFound = 0;
    let orderItemsUpdated = 0;
    const notFoundSkus: string[] = [];

    for (const row of records) {
      const sku = row.sku?.trim();
      const cost = parseSpanishNumber(row.coste);

      if (!sku) {
        continue;
      }

      // Buscar producto por SKU
      const [product] = await db
        .select({ id: products.id, currentCost: products.currentCost })
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      if (!product) {
        productsNotFound++;
        if (notFoundSkus.length < 20) {
          notFoundSkus.push(sku);
        }
        continue;
      }

      // Actualizar el coste del producto
      await db
        .update(products)
        .set({
          currentCost: cost.toFixed(2),
          costUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      productsUpdated++;

      // Actualizar los costes en los items de pedidos existentes
      const result = await db
        .update(wcOrderItems)
        .set({
          unitCost: cost.toFixed(2),
          totalCost: sql<string>`ROUND(${cost}::numeric * ${wcOrderItems.quantity}, 2)`,
        })
        .where(eq(wcOrderItems.productId, product.id));

      // Contar items actualizados (aproximación)
      orderItemsUpdated += 1; // No podemos saber cuántos exactamente sin otra query
    }

    console.log(`[IMPORT COSTS] Complete: ${productsUpdated} products updated, ${productsNotFound} not found`);

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: records.length,
        productsUpdated,
        productsNotFound,
        notFoundSkus: notFoundSkus.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("[IMPORT COSTS] Error:", error);
    return NextResponse.json(
      {
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
