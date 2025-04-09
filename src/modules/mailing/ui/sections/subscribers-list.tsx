"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { DataTableSkeleton } from "@/components/table-skeleton";
import { DataTable } from "../components/subscribers-table/table";
import { subscribersListColumns } from "../components/subscribers-table/table-columns";

import type { Subscriber } from "../../types";

export const SubscribersList = () => {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <ErrorBoundary fallback={<div>Error al cargar la sección de suscriptores</div>}>
        <SubscribersListSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

export const SubscribersListSuspense = () => {
  const [data] = trpc.subscribers.getMany.useSuspenseQuery();
  const subscribers = data as Subscriber[];

  return <DataTable columns={subscribersListColumns} data={subscribers} />;
};