import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { emailSettings, emailTemplates, stockNotifications, subscribers } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { sendEmail } from "../../services/email-sender";
import { createStockNotification } from "../../services/stock-notifications";

import { stockNotificationsSchema } from "../../validations/stock-notifications";

export const stockNotificationsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async () => {
    const notifications = await db.select().from(stockNotifications).orderBy(stockNotifications.id);
    return notifications;
  }),

  create: protectedProcedure.input(stockNotificationsSchema).mutation(async ({ input }) => {
    const { productId, productName, productSku, variant, email, firstName, lastName } = input;

    try {
      const result = await createStockNotification({
        email,
        firstName,
        productId: parseInt(productId, 10),
        productName,
        productSku,
        variant,
        metadata: {
          source: "admin_panel",
          createdAt: new Date().toISOString(),
          lastName,
        },
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Error al crear notificación de stock",
        });
      }

      return {
        success: true,
        notificationId: result.notificationId,
      };
    } catch (error) {
      console.error("Error en create stock notification mutation:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Error desconocido al crear notificación",
      });
    }
  }),

  sendNow: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const { id } = input;

    // Buscar la notificación de stock
    const [notification] = await db
      .select()
      .from(stockNotifications)
      .where(eq(stockNotifications.id, id))
      .limit(1);

    if (!notification) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Notificación de stock no encontrada"
      });
    }

    if (notification.status !== "pending") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "La notificación debe estar en estado 'pendiente' para enviar un email",
      });
    }

    // Obtener el suscriptor asociado
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, notification.subscriberId))
      .limit(1);

    if (!subscriber) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Suscriptor no encontrado"
      });
    }

    // Obtener la plantilla de email para notificaciones de stock
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, "Stock notification"))
      .limit(1);

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plantilla 'Stock notification' no encontrada",
      });
    }

    // Obtener configuración de email
    const [emailConfig] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.isActive, true))
      .limit(1);

    if (!emailConfig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No se encontró una configuración de email activa",
      });
    }

    try {
      // Personalizar el contenido del email
      let emailContent = template.content;
      let emailSubject = template.subject;

      // Función para personalizar el contenido
      const personalizeContent = (content: string) => {
        const currentDate = new Date();
        return content
          .replace(/{{subscriberId}}/g, notification.subscriberId.toString())
          .replace(/{{firstName}}/g, subscriber.firstName || "")
          .replace(/{{lastName}}/g, subscriber.lastName || "")
          .replace(/{{email}}/g, subscriber.email)
          .replace(/{{productId}}/g, notification.productId.toString())
          .replace(/{{productName}}/g, notification.productName)
          .replace(/{{productSku}}/g, notification.productSku)
          .replace(/{{variant}}/g, notification.variant || "")
          .replace(/{{currentDate}}/g, currentDate.toLocaleDateString())
          .replace(/{{currentYear}}/g, currentDate.getFullYear().toString());
      };

      // Personalizar el contenido y asunto
      emailContent = personalizeContent(emailContent);
      emailSubject = personalizeContent(emailSubject);

      // Enviar el email
      const emailResult = await sendEmail({
        to: subscriber.email,
        subject: emailSubject,
        html: emailContent,
        from: {
          name: emailConfig.defaultFromName,
          email: emailConfig.defaultFromEmail,
        },
        replyTo: emailConfig.defaultReplyTo || emailConfig.defaultFromEmail,
        metadata: {
          notificationId: notification.id,
          subscriberId: subscriber.id,
          productId: notification.productId,
          productName: notification.productName,
        },
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error ? String(emailResult.error) : "Error al enviar el email");
      }

      // Actualizar el estado de la notificación a "notified"
      await db
        .update(stockNotifications)
        .set({
          status: "notified",
          notifiedAt: new Date(),
        })
        .where(eq(stockNotifications.id, id));

      return {
        success: true,
        message: "Email de notificación de stock enviado correctamente",
      };
    } catch (error) {
      console.error("Error al enviar notificación de stock:", {
        notificationId: id,
        error: error instanceof Error ? error.message : "Error desconocido",
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Error al enviar la notificación",
      });
    }
  }),
});