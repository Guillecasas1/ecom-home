"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, Package, Percent, ShoppingCart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/modules/profitability/types";
import { cn, formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const hasAlerts =
    stats.ordersWithMissingCosts > 0 ||
    stats.productsMissingCosts > 0 ||
    stats.shippingMethodsMissingCosts > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
          <p className="text-xs text-muted-foreground">{stats.periodLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Costes</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalCosts)}</div>
          <p className="text-xs text-muted-foreground">Productos + Envíos + Empaquetado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Beneficio</CardTitle>
          {stats.totalProfit >= 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {formatCurrency(stats.totalProfit)}
          </div>
          <p className="text-xs text-muted-foreground">Ventas - Costes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margen</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              stats.profitMargin >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {stats.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">{stats.totalOrders} pedidos</p>
        </CardContent>
      </Card>

      {hasAlerts && (
        <Card className="md:col-span-2 lg:col-span-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertas de Costes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {stats.ordersWithMissingCosts > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{stats.ordersWithMissingCosts}</strong> pedidos con productos sin coste
                  </span>
                </div>
              )}
              {stats.productsMissingCosts > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{stats.productsMissingCosts}</strong> productos sin coste asignado
                  </span>
                </div>
              )}
              {stats.shippingMethodsMissingCosts > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{stats.shippingMethodsMissingCosts}</strong> métodos de envío sin coste
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
