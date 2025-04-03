import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { automationSteps, emailAutomations, emailSettings, emailTemplates, stockNotifications } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { prepareAndSendEmail } from "../../services/email-scheduler";
import { createStockNotification } from "../../services/stock-notifications";

import type { Automation, TriggerSettings } from "../../types";
import { stockNotificationsSchema } from "../../validations/stock-notifications";

export const stockNotificationsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async () => {
    const subscribers = await db.select().from(stockNotifications).orderBy(stockNotifications.id);
    return subscribers;
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

    // Buscar la automatización y comprobar si es válida en una sola consulta
    const [automation] = await db
      .select()
      .from(emailAutomations)
      .where(eq(emailAutomations.id, id))
      .limit(1);

    if (!automation) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (automation.status !== "pending") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "La automatización debe estar en estado 'pendiente' para enviar un email",
      });
    }

    // Realizar todas las consultas en paralelo para mejorar rendimiento
    const [stepResult, emailConfigResult] = await Promise.all([
      // Obtener el paso activo
      db
        .select()
        .from(automationSteps)
        .where(and(eq(automationSteps.automationId, id), eq(automationSteps.isActive, true)))
        .orderBy(automationSteps.stepOrder)
        .limit(1),

      // Obtener configuración de email
      db.select().from(emailSettings).where(eq(emailSettings.isActive, true)).limit(1),
    ]);

    const [step] = stepResult;
    const [emailConfig] = emailConfigResult;

    // Validaciones
    if (!step || step.stepType !== "send_email") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No se encontró un paso de tipo 'send_email' para la automatización",
      });
    }

    if (!emailConfig) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No se encontró una configuración de email activa",
      });
    }

    // Obtener la plantilla si existe (solo si hay templateId)
    let template = null;
    if (step.templateId) {
      [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, step.templateId))
        .limit(1);
    }

    const triggerSettings = automation.triggerSettings as TriggerSettings;

    try {
      // Intentar enviar el email
      const emailResult = await prepareAndSendEmail(
        automation as Automation,
        step,
        template,
        triggerSettings,
        emailConfig
      );

      if (!emailResult.success) {
        throw new Error(`Error al enviar el email: ${emailResult.error}`);
      }

      // Actualizar el estado de la automatización a completado
      await db
        .update(emailAutomations)
        .set({
          status: "completed",
          isActive: false,
          updatedAt: new Date(), // Añadir fecha de actualización
        })
        .where(eq(emailAutomations.id, id));

      return {
        success: true,
        message: "Email enviado correctamente",
        emailId: emailResult.success,
      };
    } catch (error) {
      // Log detallado del error para depuración
      console.error("Error al enviar email manualmente:", {
        automationId: id,
        error: error instanceof Error ? error.message : "Error desconocido",
        context: "sendNow mutation",
      });

      throw error;
    }
  }),
});
