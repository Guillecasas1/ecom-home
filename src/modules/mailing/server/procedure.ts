import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { emailAutomations } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const triggerSettingsSchema = z.object({
  orderId: z.number(),
  scheduledDate: z.string(),
  customerEmail: z.string().email(),
  subscriberId: z.number(),
  customerName: z.string().optional()
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
      await db
        .update(emailAutomations)
        .set(updateData)
        .where(eq(emailAutomations.id, id!));
    }),
  pauseOne: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
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
});
