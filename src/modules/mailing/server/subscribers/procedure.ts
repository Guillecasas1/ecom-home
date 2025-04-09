import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const subscribersRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async () => {
    const subs = await db.select().from(subscribers).orderBy(subscribers.id);
    return subs;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [subscriber] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, input.id))
        .limit(1);

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      return subscriber;
    }),

  unsubscribe: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, reason = "admin_action" } = input;

      const [subscriber] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, id))
        .limit(1);

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      await db
        .update(subscribers)
        .set({
          isActive: false,
          unsubscribedAt: new Date(),
          customAttributes: {
            ...(subscriber.customAttributes || {}),
            unsubscribeReason: reason,
            unsubscribeSource: "admin_panel",
            lastUnsubscribeDate: new Date().toISOString(),
          },
        })
        .where(eq(subscribers.id, id));

      return {
        success: true,
        message: "Subscriber has been unsubscribed successfully",
      };
    }),

  resubscribe: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const [subscriber] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.id, id))
        .limit(1);

      if (!subscriber) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      await db
        .update(subscribers)
        .set({
          isActive: true,
          unsubscribedAt: null,
          customAttributes: {
            ...(subscriber.customAttributes || {}),
            resubscribedAt: new Date().toISOString(),
            resubscribeSource: "admin_panel",
          },
        })
        .where(eq(subscribers.id, id));

      return {
        success: true,
        message: "Subscriber has been resubscribed successfully",
      };
    }),
});