// lib/services/stock-notification-service.ts
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  emailTemplates,
  stockEvents,
  stockNotifications,
  subscribers
} from "@/db/schema";
import { sendEmail } from "./email-sender";

/**
 * Crea una nueva solicitud de notificación de stock
 */
export async function createStockNotification ({
  email,
  firstName,
  lastName,
  productId,
  productName,
  productSku,
  variant,
  metadata,
}: {
  email: string;
  firstName: string;
  lastName: string;
  productId: number;
  productName: string;
  productSku: string;
  variant?: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; notificationId?: number; error?: string }> {
  try {
    // Buscar o crear el suscriptor
    let subscriberId: number;

    // Buscar primero si el suscriptor existe
    const [existingSubscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (existingSubscriber) {
      subscriberId = existingSubscriber.id;
    } else {
      // Crear un nuevo suscriptor
      const [newSubscriber] = await db
        .insert(subscribers)
        .values({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          source: "stock_notification",
          customAttributes: {
            lastStockRequest: new Date().toISOString(),
            lastRequestedProductId: productId,
          },
        })
        .returning({ id: subscribers.id });

      subscriberId = newSubscriber.id;
    }

    // Verificar si ya existe una solicitud activa para este producto y suscriptor
    const [existingNotification] = await db
      .select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.subscriberId, subscriberId),
          eq(stockNotifications.productId, productId),
          eq(stockNotifications.variant, variant || ""),
          eq(stockNotifications.isActive, true),
          eq(stockNotifications.status, "pending")
        )
      )
      .limit(1);

    if (existingNotification) {
      // Ya existe una solicitud, simplemente devolver su ID
      return {
        success: true,
        notificationId: existingNotification.id,
      };
    }

    // Crear una nueva notificación
    // Caducidad en 180 días por defecto
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);

    const [newNotification] = await db
      .insert(stockNotifications)
      .values({
        subscriberId,
        productId,
        productName,
        productSku,
        variant: variant || null,
        requestDate: new Date(),
        status: "pending",
        isActive: true,
        expiresAt,
        metadata: metadata || {},
      })
      .returning({ id: stockNotifications.id });

    return {
      success: true,
      notificationId: newNotification.id,
    };
  } catch (error) {
    console.error("Error creating stock notification", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Procesa los eventos de reposición de stock y envía notificaciones
 */
export async function processStockRestockEvent ({
  productId,
  productSku,
  productName,
  variant,
  quantity,
  metadata,
}: {
  productId: number;
  productSku: string;
  productName: string;
  variant?: string;
  quantity: number;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; notificationsSent: number; error?: string }> {
  try {
    // Registrar el evento de reposición
    await db.insert(stockEvents).values({
      productId,
      productSku,
      variant: variant || null,
      eventType: "restock",
      quantity,
      eventDate: new Date(),
      metadata: metadata || {},
    });

    // Si la cantidad es menor o igual a 0, no enviamos notificaciones
    if (quantity <= 0) {
      return { success: true, notificationsSent: 0 };
    }

    console.log("Buscando notificaciones con los siguientes criterios:", {
      productName,
      variant,
      status: "pending",
      isActive: true
    });

    // Obtener todas las notificaciones pendientes para este producto
    const pendingNotifications = await db
      .select()
      .from(stockNotifications)
      .where(
        and(
          eq(stockNotifications.productName, productName),
          eq(stockNotifications.status, "pending"),
          eq(stockNotifications.isActive, true),
          variant
            ? eq(stockNotifications.variant, variant)
            : isNull(stockNotifications.variant)
        )
      );

    console.log("Notificaciones encontradas", pendingNotifications);

    if (pendingNotifications.length === 0) {
      return { success: true, notificationsSent: 0 };
    }

    console.info(`Found ${pendingNotifications.length} pending notifications for product ${productId}`);

    // Obtener la plantilla de email para reposición de stock
    const [stockTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, "Stock notification"))
      .limit(1);

    if (!stockTemplate) {
      throw new Error("Email template 'Stock notification' not found");
    }

    let notificationsSent = 0;

    // Para cada notificación pendiente, enviar el email inmediatamente
    for (const notification of pendingNotifications) {
      // Obtener datos del suscriptor
      const [subscriber] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, notification.subscriberId))
        .limit(1);

      if (!subscriber || !subscriber.isActive) {
        continue;
      }

      // Enviar el email inmediatamente
      const emailResult = await sendEmail({
        to: subscriber.email,
        subject: `¡${notification.productName} ya está disponible!`,
        html: stockTemplate.content,
        from: {
          name: "La Batita Presumida",
          email: "hola@labatitapresumida.com"
        },
        metadata: {
          notificationId: notification.id,
          subscriberId: subscriber.id,
          productId: notification.productId,
          productName: notification.productName,
          productSku: notification.productSku,
          variant: notification.variant,
          requestDate: notification.requestDate,
        },
      });

      if (emailResult.success) {
        notificationsSent++;

        // Actualizar el estado de la notificación
        await db
          .update(stockNotifications)
          .set({
            status: "notified",
            notifiedAt: new Date(),
          })
          .where(eq(stockNotifications.id, notification.id));
      }
    }

    // Actualizar el evento de reposición con la información de procesamiento
    await db
      .update(stockEvents)
      .set({
        processedAt: new Date(),
        metadata: {
          ...metadata,
          notificationsSent,
          totalNotifications: pendingNotifications.length,
        },
      })
      .where(eq(stockEvents.productId, productId));

    console.info(`Sent ${notificationsSent} stock notifications for product ${productId}`);

    return {
      success: true,
      notificationsSent,
    };
  } catch (error) {
    console.error("Error processing stock restock event", { error });
    return {
      success: false,
      notificationsSent: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancela una notificación de stock
 */
export async function cancelStockNotification (
  notificationId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(stockNotifications)
      .set({
        status: "cancelled",
        isActive: false,
      })
      .where(eq(stockNotifications.id, notificationId));

    return { success: true };
  } catch (error) {
    console.error("Error cancelling stock notification", { error, notificationId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Obtiene todas las notificaciones pendientes para un suscriptor
 */
export async function getSubscriberPendingNotifications (
  subscriberId: number
): Promise<any[]> {
  return db
    .select()
    .from(stockNotifications)
    .where(
      and(
        eq(stockNotifications.subscriberId, subscriberId),
        eq(stockNotifications.status, "pending"),
        eq(stockNotifications.isActive, true)
      )
    );
}