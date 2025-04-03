import { StockNotificationsHeader } from "../sections/stock-notifications-header";
import { StockNotificationsList } from "../sections/stock-notifications-list";

export const StockNotificationsView = () => {
  return (
    <div className="flex flex-col gap-6 px-8">
      <StockNotificationsHeader />
      <StockNotificationsList />
    </div>
  );
};
