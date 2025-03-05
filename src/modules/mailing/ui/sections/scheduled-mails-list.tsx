"use client";

import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { DataTableSkeleton } from "@/components/table-skeleton";
import { trpc } from "@/trpc/client";

import { Automation } from "../../types";
import { DataTable } from "../components/scheduled-mails-table/table";
import { emailAutomationsListColumns } from "../components/scheduled-mails-table/table-columns";

export const ScheduledMailsList = () => {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <ErrorBoundary
        fallback={<div>Error al cargar la sección de proyectos</div>}
      >
        <ScheduledMailsListSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

export const ScheduledMailsListSuspense = () => {
  const [data] = trpc.reviews.getMany.useSuspenseQuery();
  const automations = data as Automation[];
  return <DataTable columns={emailAutomationsListColumns} data={automations} />;
};
