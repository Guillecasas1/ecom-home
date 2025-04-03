"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { DataTableSkeleton } from "@/components/table-skeleton";
import { StockNotification } from "../../types";
import { DataTable } from "../components/stock-notifications-table/table";
import { stockNotificationsListColumns } from "../components/stock-notifications-table/table-columns";

export const StockNotificationsList = () => {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <ErrorBoundary fallback={<div>Error al cargar la sección de proyectos</div>}>
        <StockNotificationsSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

export const StockNotificationsSuspense = () => {
  const [data] = trpc.stockNotifications.getMany.useSuspenseQuery();
  const notifications = data as StockNotification[];

  return <DataTable columns={stockNotificationsListColumns} data={notifications} />;
};
