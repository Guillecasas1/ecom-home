"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { type FC } from "react";

export const DataTableSkeleton: FC = () => {
  return (
    <div className="space-y-4">
      {/* Header de la tabla */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        {/* Header de columnas */}
        <div className="border-b bg-slate-50 p-4">
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`header-${index}`} className="h-4 w-[100px]" />
            ))}
          </div>
        </div>

        {/* Filas de la tabla */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={`row-${index}`} className="border-b p-4">
            <div className="flex items-center gap-4">
              {Array.from({ length: 4 }).map((_, cellIndex) => (
                <Skeleton
                  key={`cell-${index}-${cellIndex}`}
                  className="h-4 w-[100px]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer de la tabla */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`pagination-${index}`} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}; 