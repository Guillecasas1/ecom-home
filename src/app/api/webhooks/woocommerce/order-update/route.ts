import { NextResponse } from "next/server";

import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  automationSteps,
  emailAutomations,
  emailTemplates,
  subscribers,
} from "@/db/schema";
import { WoocommerceOrder } from "@/types/woocommerce";
import { env } from "@/utils/env/server";

export async function POST (request: Request) {
  const clonedRequest = request.clone();

  try {
    // Verificar firma del webhook (importante para seguridad)
    const signature = request.headers.get("x-wc-webhook-signature");
    const rawBody = await clonedRequest.text();

    if (!validateWooCommerceSignature(signature, rawBody)) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = (await request.json()) as WoocommerceOrder;

    // Verificar si el estado del pedido cambió a "completed"
    if (data.status !== "completed") {
      return NextResponse.json({
        status: "ignored",
        reason: "Order not completed",
      });
    }

    // Obtener la plantilla de "Review Reminder"
    const [followupTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, "Review reminder"));

    if (!followupTemplate) {
      console.error("Email template 'Seguimiento post-compra' not found");
      return NextResponse.json(
        {
          error: "Email template not found",
          hint: "Create a template named 'Seguimiento post-compra'",
        },
        { status: 200 }
      );
    }

    const result = await processSubscriber(data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }

    const delayDays = env.NODE_ENV === "development" ? 0 : 15;

    // Crear la automatización
    const automationResult = await createFollowupAutomation({
      orderId: data.id,
      subscriberId: result.subscriberId!,
      customerEmail: data.billing.email!,
      customerName: `${data.billing.first_name} ${data.billing.last_name}`,
      templateId: followupTemplate.id,
      delayDays,
    });

    if (!automationResult.success) {
      return NextResponse.json(
        { error: automationResult.error },
        { status: 200 }
      );
    }

    console.log("Follow-up email scheduled", {
      orderId: data.id,
      scheduledDate: automationResult.scheduledDate,
    });

    return NextResponse.json({
      success: true,
      message: "Follow-up email scheduled",
      details: {
        orderId: data.id,
        scheduledDate: automationResult.scheduledDate,
        automationId: automationResult.automationId,
      },
    });
  } catch (error) {
    console.error("Error processing WooCommerce webhook:", error);
    return NextResponse.json({ message: "Error" }, { status: 200 });
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

// Función para calcular una fecha futura con un delay en días
function calculateDateAfterDelay (days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function processSubscriber (data: WoocommerceOrder): Promise<{
  success: boolean;
  subscriberId?: number;
  error?: string;
}> {
  try {
    const subscriberEmail = data.billing.email!;

    // Primero intentar actualizar un suscriptor existente
    const [existingSubscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, subscriberEmail))
      .limit(1);

    if (existingSubscriber) {
      // Actualizar datos del suscriptor existente
      await db
        .update(subscribers)
        .set({
          firstName: data.billing.first_name || existingSubscriber.firstName,
          lastName: data.billing.last_name || existingSubscriber.lastName,
          phone: data.billing.phone || existingSubscriber.phone,
          updatedAt: new Date(),
          customAttributes: {
            lastOrderId: data.id,
            lastOrderDate: data.date_completed,
            lastOrderTotal: data.total,
            ...(existingSubscriber.customAttributes || {}),
          },
        })
        .where(eq(subscribers.id, existingSubscriber.id));

      return {
        success: true,
        subscriberId: existingSubscriber.id,
      };
    } else {
      // Crear nuevo suscriptor
      const [newSubscriber] = await db
        .insert(subscribers)
        .values({
          email: subscriberEmail,
          firstName: data.billing.first_name,
          lastName: data.billing.last_name,
          phone: data.billing.phone,
          source: "woocommerce_order",
          customAttributes: {
            lastOrderId: data.id,
            lastOrderDate: data.date_completed,
            lastOrderTotal: data.total,
          },
        })
        .returning({ id: subscribers.id });

      return {
        success: true,
        subscriberId: newSubscriber.id,
      };
    }
  } catch (error) {
    console.error("Error processing subscriber", {
      error,
      email: data.billing.email,
    });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error processing subscriber",
    };
  }
}

async function createFollowupAutomation (params: {
  orderId: number;
  subscriberId: number;
  customerEmail: string;
  customerName: string;
  templateId: number;
  delayDays: number;
}): Promise<{
  success: boolean;
  automationId?: number;
  scheduledDate?: Date;
  error?: string;
}> {
  try {
    const scheduledDate = calculateDateAfterDelay(params.delayDays);

    // Transacción para asegurar que ambas operaciones (automatización y paso) se realicen juntas
    const result = await db.transaction(async (tx) => {
      // Crear la automatización
      const [newAutomation] = await tx
        .insert(emailAutomations)
        .values({
          name: `Seguimiento Pedido #${params.orderId}`,
          description: `Email automático ${params.delayDays} días después de completar el pedido #${params.orderId}`,
          triggerType: "order_completed",
          triggerSettings: {
            orderId: params.orderId,
            scheduledDate: scheduledDate.toISOString(),
            customerEmail: params.customerEmail,
            subscriberId: params.subscriberId,
            customerName: params.customerName,
          },
          status: "pending",
          isActive: true,
        })
        .returning({ id: emailAutomations.id });

      // Crear el paso de la automatización (el email a enviar)
      await tx.insert(automationSteps).values({
        automationId: newAutomation.id,
        stepOrder: 1,
        stepType: "send_email",
        templateId: params.templateId,
        subject: "👩‍🏫 ¡Seño, necesitamos tu nota final! 📢",
        waitDuration: params.delayDays * 24 * 60, // convertir días a minutos
        isActive: true,
      });

      return { automationId: newAutomation.id };
    });

    return {
      success: true,
      automationId: result.automationId,
      scheduledDate,
    };
  } catch (error) {
    console.error("Error creating followup automation", {
      error,
      orderId: params.orderId,
    });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error creating automation",
    };
  }
}
