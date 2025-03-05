import { ReviewsReminderHeader } from "../sections/reviews-reminder-header";
import { ScheduledMailsList } from "../sections/scheduled-mails-list";

export const ReviewsReminderView = () => {
  return (
    <div className="flex flex-col px-8 gap-6">
      <ReviewsReminderHeader />
      <ScheduledMailsList />
    </div>
  );
};