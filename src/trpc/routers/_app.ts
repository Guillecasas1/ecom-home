// eslint-disable check-file/filename-naming-convention
// eslint-disable check-file/filename-naming

import { automationsRouter } from "@/modules/automations/server/procedure";
import { reviewsRouter } from "@/modules/mailing/server/reviews/procedure";
import { stockNotificationsRouter } from "@/modules/mailing/server/stock/procedure";
import { subscribersRouter } from "@/modules/mailing/server/subscribers/procedure";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  automations: automationsRouter,
  reviews: reviewsRouter,
  stockNotifications: stockNotificationsRouter,
  subscribers: subscribersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
