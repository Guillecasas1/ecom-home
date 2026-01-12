"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OrderSummary } from "@/modules/profitability/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const ordersColumns: ColumnDef<OrderSummary>[] = [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        Pedido
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const hasAlert = row.original.hasItemsWithoutCost || row.original.hasShippingWithoutCost;
      
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">#{row.original.orderNumber}</span>
          {hasAlert && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {row.original.hasItemsWithoutCost && "Productos sin coste asignado"}
                    {row.original.hasItemsWithoutCost && row.original.hasShippingWithoutCost && " / "}
                    {row.original.hasShippingWithoutCost && "Envío sin coste asignado"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        Fecha
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => formatDate(row.original.orderDate),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        "on-hold": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      };
      
      return (
        <Badge className={cn("capitalize", statusColors[status] || "")}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => row.original.customerName || "-",
  },
  {
    accessorKey: "totalSale",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        Venta
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.totalSale)}</span>
    ),
  },
  {
    accessorKey: "totalCost",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        Coste
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const cost = row.original.totalCost;
      if (cost === null) {
        return <span className="text-muted-foreground">-</span>;
      }
      return <span>{formatCurrency(cost)}</span>;
    },
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        Beneficio
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const profit = row.original.profit;
      if (profit === null) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className={cn("font-medium", profit >= 0 ? "text-green-600" : "text-red-600")}>
          {formatCurrency(profit)}
        </span>
      );
    },
  },
  {
    accessorKey: "profitMargin",
    header: "Margen",
    cell: ({ row }) => {
      const margin = row.original.profitMargin;
      if (margin === null) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className={cn("font-medium", margin >= 0 ? "text-green-600" : "text-red-600")}>
          {margin.toFixed(1)}%
        </span>
      );
    },
  },
];
