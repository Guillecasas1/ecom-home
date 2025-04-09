import { SubscribersHeader } from "../sections/subscribers-header";
import { SubscribersList } from "../sections/subscribers-list";

export const SubscribersView = () => {
  return (
    <div className="flex flex-col gap-6 px-8">
      <SubscribersHeader />
      <SubscribersList />
    </div>
  );
};