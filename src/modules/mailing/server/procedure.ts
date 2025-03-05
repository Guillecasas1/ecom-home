import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { emailAutomations } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const reviewsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async () => {
    const data = await db.select().from(emailAutomations);

    return data;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, isActive } = input;
      await db
        .update(emailAutomations)
        .set({
          isActive,
        })
        .where(eq(emailAutomations.id, id));

      // revalidatePath("/admin/mailing/reviews");
    }),
});
