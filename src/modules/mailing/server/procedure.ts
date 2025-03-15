import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { automationSteps, emailAutomations, emailSettings, emailTemplates } from "@/db/schema";
import { prepareAndSendEmail } from "@/lib/services/email-scheduler";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import type { Automation, TriggerSettings } from "../types";

const triggerSettingsSchema = z.object({
  orderId: z.number(),
  scheduledDate: z.string(),
  customerEmail: z.string().email(),
  subscriberId: z.number(),
  customerName: z.string().optional(),
});

export const reviewsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async () => {
    const data = await db.select().from(emailAutomations).orderBy(emailAutomations.id);

    return data;
  }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean(),
        status: z.string(),
        triggerSettings: triggerSettingsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      await db.update(emailAutomations).set(updateData).where(eq(emailAutomations.id, id!));
    }),
  pauseOne: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const { id } = input;
    await db
      .update(emailAutomations)
      .set({
        status: "paused",
        isActive: false,
      })
      .where(eq(emailAutomations.id, id));
  }),
  toggleStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newStatus: z.enum(["paused", "pending", "completed"]),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, newStatus, isActive } = input;
      await db
        .update(emailAutomations)
        .set({
          status: newStatus,
          isActive,
        })
        .where(eq(emailAutomations.id, id));
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
