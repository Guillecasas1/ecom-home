"use client";

import { useState, useTransition } from "react";
import { Check, Package, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updatePackagingCostAction } from "@/modules/profitability/actions";
import { formatCurrency } from "@/lib/utils";

interface PackagingCostCardProps {
  currentCost: number;
  totalOrders: number;
}

export function PackagingCostCard({ currentCost, totalOrders }: PackagingCostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentCost.toString());
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        const cost = parseFloat(value);
        if (isNaN(cost) || cost < 0) {
          toast.error("Introduce un valor válido");
          return;
        }
        await updatePackagingCostAction(cost);
        toast.success("Coste de empaquetado actualizado");
        setIsEditing(false);
      } catch (error) {
        toast.error("Error al actualizar el coste");
      }
    });
  };

  const handleCancel = () => {
    setValue(currentCost.toString());
    setIsEditing(false);
  };

  const totalPackagingCost = currentCost * totalOrders;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Coste de Empaquetado
        </CardTitle>
        <CardDescription>
          Coste fijo que se aplica a cada pedido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Coste por pedido:</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-8 w-24"
                  disabled={isPending}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <span className="text-muted-foreground">€</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{formatCurrency(currentCost)}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total pedidos:</span>
              <span className="font-medium">{totalOrders}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Coste total empaquetado:</span>
              <span className="font-medium">{formatCurrency(totalPackagingCost)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
