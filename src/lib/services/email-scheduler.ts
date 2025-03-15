// lib/services/email-scheduler.ts
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  automationSteps,
  emailAutomations,
  emailSends,
  emailSettings,
  emailTemplates,
  subscribers,
} from "@/db/schema";
import { sendEmail } from "@/lib/services/email-sender";
import type { Automation, EmailConfig, Step, Template, TriggerSettings } from "@/modules/mailing/types";

/**
 * Procesa los emails programados y los envía cuando sea el momento
 */
export async function processScheduledEmails() {
  const now = new Date();
  console.info("Starting scheduled email processing");

  try {
    // Obtener configuración de email activa
    const [emailConfig] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.isActive, true))
      .limit(1);

    if (!emailConfig) {
      throw new Error("No active email configuration found");
    }

    // Buscar todas las automatizaciones activas de tipo order_completed
    const activeAutomations = (await db
      .select()
      .from(emailAutomations)
      .where(
        and(
          eq(emailAutomations.isActive, true),
          eq(emailAutomations.triggerType, "order_completed"),
          eq(emailAutomations.status, "pending")
        )
      )) as Automation[];

    console.info(`Found ${activeAutomations.length} active automations to process`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const automation of activeAutomations) {
      try {
        // Verificar si la fecha programada ya pasó
        const triggerSettings = automation.triggerSettings as TriggerSettings;

        if (!triggerSettings || !triggerSettings.scheduledDate) {
          console.warn("Automation has invalid trigger settings", {
            automationId: automation.id,
          });
          results.skipped++;
          continue;
        }

        const scheduledDate = new Date(triggerSettings.scheduledDate);

        // Si la fecha programada aún no ha llegado, saltamos esta automatización
        if (scheduledDate > now) {
          continue;
        }

        // Obtener los pasos activos para esta automatización
        const [step] = await db
          .select()
          .from(automationSteps)
          .where(and(eq(automationSteps.automationId, automation.id), eq(automationSteps.isActive, true)))
          .orderBy(automationSteps.stepOrder)
          .limit(1);

        if (!step || step.stepType !== "send_email") {
          console.warn("Automation has no valid steps", {
            automationId: automation.id,
          });
          results.skipped++;
          continue;
        }

        results.processed++;
        console.info(`Processing automation ${automation.id} for order ${triggerSettings.orderId}`);

        // Obtener la plantilla si existe
        let template = null;
        if (step.templateId) {
          [template] = await db
            .select()
            .from(emailTemplates)
            .where(eq(emailTemplates.id, step.templateId))
            .limit(1);
        }

        // Preparar el email para envío
        const emailResult = await prepareAndSendEmail(
          automation,
          step,
          template,
          triggerSettings,
          emailConfig
        );

        if (emailResult.success) {
          results.sent++;

          // Desactivar la automatización ya que se ejecutó correctamente
          await db
            .update(emailAutomations)
            .set({
              status: "completed",
              isActive: false,
            })
            .where(eq(emailAutomations.id, automation.id));

          console.info(
            `Email sent successfully for automation ${automation.id}, order ${triggerSettings.orderId}`
          );
        } else {
          results.failed++;
          console.error(`Failed to send email for automation ${automation.id}`, {
            error: emailResult.error,
            orderId: triggerSettings.orderId,
          });
        }
      } catch (error) {
        results.failed++;
        console.error(`Error processing automation ${automation.id}`, {
          error,
        });
      }
    }

    console.info("Finished processing scheduled emails", results);
    return results;
  } catch (error) {
    console.error("Error in email scheduler", { error });
    throw error;
  }
}

/**
 * Prepara y envía un email basado en una automatización
 */
export async function prepareAndSendEmail(
  automation: Automation,
  step: Step,
  template: Template | null,
  triggerSettings: TriggerSettings,
  emailConfig: EmailConfig
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Obtener el suscriptor por ID (más eficiente)
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, triggerSettings.subscriberId))
      .limit(1);

    if (!subscriber) {
      throw new Error(`Subscriber with ID ${triggerSettings.subscriberId} not found`);
    }

    // Preparar el contenido del email
    let emailContent = "";
    let emailSubject = template?.subject || step.subject || "";

    // Si el paso tiene una plantilla asociada, usarla
    if (template) {
      emailContent = template.content;
    }
    // Si no hay plantilla pero hay contenido directo en el paso
    else if (step.content) {
      emailContent = step.content;
    }
    // Si no hay ni plantilla ni contenido, no podemos enviar el email
    else {
      throw new Error(
        `No email content or template available. Template ID: ${step.templateId}, Step ID: ${step.id}`
      );
    }

    if (!emailSubject) {
      throw new Error("No email subject available");
    }

    // Personalizar el contenido del email
    emailContent = personalizeEmailContent(emailContent, {
      subscriberId: subscriber.id,
      firstName: subscriber.firstName || "",
      lastName: subscriber.lastName || "",
      email: subscriber.email,
      orderId: triggerSettings.orderId,
      customerName: triggerSettings.customerName || subscriber.firstName || "Cliente",
    });

    // Personalizar el asunto del email
    emailSubject = personalizeEmailContent(emailSubject, {
      subscriberId: subscriber.id,
      firstName: subscriber.firstName || "",
      lastName: subscriber.lastName || "",
      email: subscriber.email,
      orderId: triggerSettings.orderId,
      customerName: triggerSettings.customerName || subscriber.firstName || "Cliente",
    });

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
        automationId: automation.id,
        orderId: triggerSettings.orderId,
        subscriberId: subscriber.id,
      },
    });

    if (emailResult.success) {
      // Registrar el envío
      await db.insert(emailSends).values({
        subscriberId: subscriber.id,
        sentAt: new Date(),
        status: "sent",
        emailContent: emailContent || "",
        metadata: {
          automationId: automation.id,
          // Asegurarnos de que todos los valores en metadata no sean undefined
          stepId: step.id || null,
          orderId: triggerSettings.orderId || null,
          // Verificar si messageId existe, si no, usar un valor por defecto
          messageId: emailResult.messageId || "unknown",
        },
      });

      return { success: true };
    } else {
      throw new Error((emailResult.error as string) || "Unknown error sending email");
    }
  } catch (error) {
    console.error("Error preparing and sending email", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Personaliza el contenido del email sustituyendo variables
 */
function personalizeEmailContent(
  content: string,
  data: {
    subscriberId: number;
    firstName: string;
    lastName: string;
    email: string;
    orderId: number;
    customerName: string;
  }
): string {
  const currentDate = new Date();

  return content
    .replace(/{{subscriberId}}/g, data.subscriberId.toString())
    .replace(/{{firstName}}/g, data.firstName)
    .replace(/{{lastName}}/g, data.lastName)
    .replace(/{{email}}/g, data.email)
    .replace(/{{orderId}}/g, data.orderId.toString())
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{currentDate}}/g, currentDate.toLocaleDateString())
    .replace(/{{currentYear}}/g, currentDate.getFullYear().toString());
}

/**
 * Programa un email para ser enviado después de un número específico de días
 */
export async function scheduleEmail({
  templateId,
  subscriberId,
  delayDays,
  subject,
  metadata,
}: {
  templateId: number;
  subscriberId: number;
  delayDays: number;
  subject?: string;
  // eslint-disable-next-line
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; automationId?: number; error?: string }> {
  try {
    // Obtener información del suscriptor
    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.id, subscriberId))
      .limit(1);

    if (!subscriber) {
      throw new Error(`Subscriber with ID ${subscriberId} not found`);
    }

    // Calcular fecha programada
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + delayDays);

    // Crear la automatización y su paso en una transacción
    const result = await db.transaction(async (tx) => {
      const [automation] = await tx
        .insert(emailAutomations)
        .values({
          name: `Email programado: ${subject || "Sin asunto"}`,
          description: `Email programado para ${delayDays} días de retraso`,
          triggerType: "scheduled",
          triggerSettings: {
            scheduledDate: scheduledDate.toISOString(),
            subscriberId: subscriberId,
            customerEmail: subscriber.email,
            customerName: `${subscriber.firstName} ${subscriber.lastName}`.trim(),
            ...metadata,
          },
          status: "pending",
          isActive: true,
        })
        .returning({ id: emailAutomations.id });

      await tx.insert(automationSteps).values({
        automationId: automation.id,
        stepOrder: 1,
        stepType: "send_email",
        templateId: templateId,
        subject: subject,
        waitDuration: delayDays * 24 * 60, // Días a minutos
        isActive: true,
      });

      return { automationId: automation.id };
    });

    console.info("Email scheduled successfully", {
      automationId: result.automationId,
      subscriberId,
      scheduledDate: scheduledDate.toISOString(),
    });

    return {
      success: true,
      automationId: result.automationId,
    };
  } catch (error) {
    console.error("Error scheduling email", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error scheduling email",
    };
  }
}
