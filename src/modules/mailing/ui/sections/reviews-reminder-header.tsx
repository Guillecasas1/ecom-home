"use client";

import { IconMailShare, IconSettings } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

export const ReviewsReminderHeader = () => {
  return (
    <header className="flex justify-between">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center pt-8 pb-2">
        <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3">
              <IconMailShare className="h-6 w-6" />
              <h1 className="text-2xl">Reviews Reminder</h1>
            </div>
            <p className="text-muted-foreground">
              Send a reminder email to your customers to encourage them to leave a review.
            </p>
          </div>
          <div className="justify-self-end">
            <Button onClick={() => {}}>
              <IconSettings />
              Ajustes generales
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
