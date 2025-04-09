"use client";

import { IconUsers } from "@tabler/icons-react";

export const SubscribersHeader = () => {
  return (
    <header className="flex justify-between">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center pt-8 pb-2">
        <div className="flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3">
              <IconUsers className="h-6 w-6" />
              <h1 className="text-2xl">Subscribers</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your subscribers and their subscription status.
            </p>
          </div>
          <div className="flex gap-2 justify-self-end">
            {/* Add buttons here if needed */}
          </div>
        </div>
      </div>
    </header>
  );
};