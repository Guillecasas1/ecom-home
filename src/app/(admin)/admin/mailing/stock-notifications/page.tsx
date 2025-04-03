import { StockNotificationsView } from "@/modules/mailing/ui/views/stock-notifications";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function Page () {
  void trpc.stockNotifications.getMany.prefetch();

  return (
    <HydrateClient>
      <StockNotificationsView />
    </HydrateClient>
  );
}
