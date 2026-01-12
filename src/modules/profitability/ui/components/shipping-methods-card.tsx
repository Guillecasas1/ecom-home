"use client";

import { AlertTriangle, Check, Pencil, Truck, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import { updateShippingMethodAction } from "@/modules/profitability/actions";
import { ShippingMethodWithStats } from "@/modules/profitability/services/shipping-service";

interface ShippingMethodsCardProps {
  methods: ShippingMethodWithStats[];
}

function EditableRow ({ method }: { method: ShippingMethodWithStats }) {
  const [isEditing, setIsEditing] = useState(false);
  const [cost, setCost] = useState(method.cost || "");
  const [provider, setProvider] = useState(method.provider);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateShippingMethodAction(method.id, {
          cost: cost === "" ? null : parseFloat(cost),
          provider,
        });
        toast.success("Método de envío actualizado");
        setIsEditing(false);
      } catch (error) {
        toast.error("Error al actualizar");
      }
    });
  };

  const handleCancel = () => {
    setCost(method.cost || "");
    setProvider(method.provider);
    setIsEditing(false);
  };

  const hasCost = method.cost !== null;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{method.name}</span>
          {!hasCost && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nacex">Nacex</SelectItem>
              <SelectItem value="correos">Correos</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="capitalize">
            {method.provider}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-8 w-20"
              disabled={isPending}
            />
            <span className="text-muted-foreground">€</span>
          </div>
        ) : hasCost ? (
          formatCurrency(parseFloat(method.cost!))
        ) : (
          <span className="text-amber-500">Sin coste</span>
        )}
      </TableCell>
      <TableCell className="text-right">{method.ordersCount}</TableCell>
      <TableCell className="text-right">{formatCurrency(method.totalRevenue)}</TableCell>
      <TableCell className="text-right">
        {method.totalCost !== null ? (
          formatCurrency(method.totalCost)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {method.totalCost !== null ? (
          <span
            className={cn(
              "font-medium",
              method.totalRevenue - method.totalCost >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {formatCurrency(method.totalRevenue - method.totalCost)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center gap-1">
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
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ShippingMethodsCard ({ methods }: ShippingMethodsCardProps) {
  const methodsWithoutCost = methods.filter((m) => m.cost === null && m.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Métodos de Envío
            </CardTitle>
            <CardDescription>
              Gestiona los costes de envío por proveedor
            </CardDescription>
          </div>
          {methodsWithoutCost.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {methodsWithoutCost.length} sin coste
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Coste</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Coste Total</TableHead>
              <TableHead className="text-right">Beneficio</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.length > 0 ? (
              methods.map((method) => (
                <EditableRow key={method.id} method={method} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay métodos de envío registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
