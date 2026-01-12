"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowUpDown, Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductWithStats } from "@/modules/profitability/services/products-service";
import { cn, formatCurrency } from "@/lib/utils";

interface EditableCostCellProps {
  product: ProductWithStats;
  onSave: (id: number, cost: number | null) => Promise<void>;
}

function EditableCostCell({ product, onSave }: EditableCostCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(product.currentCost || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const cost = value === "" ? null : parseFloat(value);
      await onSave(product.id, cost);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving cost:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(product.currentCost || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-20"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  const hasCost = product.currentCost !== null;

  return (
    <div className="flex items-center gap-2">
      {hasCost ? (
        <span>{formatCurrency(parseFloat(product.currentCost!))}</span>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                Sin coste
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Este producto no tiene coste asignado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function createProductsColumns(
  onSaveCost: (id: number, cost: number | null) => Promise<void>
): ColumnDef<ProductWithStats>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Producto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const hasVariation = row.original.wcVariationId !== null;
        return (
          <div className="max-w-[300px]">
            <span className="font-medium line-clamp-2">{row.original.name}</span>
            {hasVariation && (
              <span className="text-xs text-muted-foreground block">
                Variación ID: {row.original.wcVariationId}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.original.sku || "-",
    },
    {
      accessorKey: "currentCost",
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
      cell: ({ row }) => <EditableCostCell product={row.original} onSave={onSaveCost} />,
    },
    {
      accessorKey: "totalQuantitySold",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Vendidos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.totalQuantitySold,
    },
    {
      accessorKey: "totalRevenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Ingresos
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatCurrency(row.original.totalRevenue),
    },
    {
      accessorKey: "totalCost",
      header: "Coste Total",
      cell: ({ row }) => {
        const cost = row.original.totalCost;
        if (cost === null) {
          return <span className="text-muted-foreground">-</span>;
        }
        return formatCurrency(cost);
      },
    },
    {
      accessorKey: "totalProfit",
      header: "Beneficio",
      cell: ({ row }) => {
        const profit = row.original.totalProfit;
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
  ];
}
