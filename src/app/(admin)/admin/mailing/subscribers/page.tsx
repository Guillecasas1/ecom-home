import { SubscribersView } from "@/modules/mailing/ui/views/subscribers";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function Page () {
  void trpc.subscribers.getMany.prefetch();

  return (
    <HydrateClient>
      <SubscribersView />
    </HydrateClient>
  );
}