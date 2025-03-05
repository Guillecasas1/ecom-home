import { ReviewsReminderView } from "@/modules/mailing/ui/views/reviews-reminder";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function Page () {
  void trpc.reviews.getMany.prefetch();

  return (
    <HydrateClient>
      <ReviewsReminderView />
    </HydrateClient>
  );
};
