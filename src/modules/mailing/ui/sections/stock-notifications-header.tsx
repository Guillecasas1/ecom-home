"use client";

import { IconMailShare } from "@tabler/icons-react";

import { CreateStockNotificationForm } from "../components/stock-notifications-form/create-form";

export const StockNotificationsHeader = () => {
  return (
    <header className="flex justify-between">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center pt-8 pb-2">
        <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3">
              <IconMailShare className="h-6 w-6" />
              <h1 className="text-2xl">
                Stock Notifications
              </h1>
            </div>
            <p className="text-muted-foreground">
              List of subscribers to receive re-stock notifications.
            </p>
          </div>
          <div className="flex gap-2 justify-self-end">
            <CreateStockNotificationForm />
          </div>
        </div>
      </div>
    </header>
  );
};
