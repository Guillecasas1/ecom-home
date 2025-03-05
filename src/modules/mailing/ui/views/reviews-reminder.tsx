import { ReviewsReminderHeader } from "../sections/reviews-reminder-header";
import { ScheduledMailsList } from "../sections/scheduled-mails-list";

export const ReviewsReminderView = () => {
  return (
    <div className="flex flex-col gap-6 px-8">
      <ReviewsReminderHeader />
      <ScheduledMailsList />
    </div>
  );
};
