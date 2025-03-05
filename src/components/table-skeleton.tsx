import { Skeleton } from "@/components/ui/skeleton";

export const DataTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header de la tabla */}
      {/* <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div> */}

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        {/* Header de columnas */}
        <div className="border-b bg-slate-50 dark:bg-black p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>

        {/* Filas de la tabla */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-b p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer de la tabla */}
      <div className="flex items-center justify-end">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}; 