import { automationsRouter } from "@/modules/automations/server/procedure";
import { reviewsRouter } from "@/modules/mailing/server/procedure";

import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  automations: automationsRouter,
  reviews: reviewsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
