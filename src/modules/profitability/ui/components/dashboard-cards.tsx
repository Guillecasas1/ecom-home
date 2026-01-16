"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Box,
  Calculator,
  DollarSign,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";
import { DashboardStats } from "@/modules/profitability/types";

interface DashboardCardsProps {
  stats: DashboardStats;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  formula?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

function MetricCard ({ title, value, description, formula, icon, trend, className }: MetricCardProps) {
  const displayValue = typeof value === "number"
    ? (value < 0 ? value : value)
    : value;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn("cursor-help transition-all hover:shadow-md", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                trend === "up" && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                trend === "down" && "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}>
                {icon}
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  trend === "up" && "text-green-600 dark:text-green-400",
                  trend === "down" && "text-red-600 dark:text-red-400"
                )}
              >
                {displayValue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {formula && (
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">Fórmula:</p>
              <p className="text-sm font-mono bg-white px-2 py-1 rounded">{formula}</p>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function DashboardCards ({ stats }: DashboardCardsProps) {
  const hasAlerts =
    stats.ordersWithMissingCosts > 0 ||
    stats.productsMissingCosts > 0 ||
    stats.shippingMethodsMissingCosts > 0;

  return (
    <div className="space-y-6">
      {/* Sección: Resumen General */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumen General
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ventas Totales"
            value={formatCurrency(stats.totalSales)}
            description={`${stats.totalOrders} pedidos en ${stats.periodLabel.toLowerCase()}`}
            formula="Σ Total de todos los pedidos"
            icon={<DollarSign className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Costes Totales"
            value={formatCurrency(stats.totalCosts)}
            description="Producto + Envío + Empaquetado"
            formula="Coste Productos + Coste Envíos + Coste Empaquetado"
            icon={<ShoppingCart className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Beneficio Neto"
            value={formatCurrency(stats.netProfit)}
            description="Después de todos los costes"
            formula="Ventas Totales - Costes Totales"
            icon={stats.netProfit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            trend={stats.netProfit >= 0 ? "up" : "down"}
          />
          <MetricCard
            title="Margen Neto"
            value={`${stats.netMargin.toFixed(1)}%`}
            description="% del beneficio sobre ventas"
            formula="(Beneficio Neto / Ventas Totales) × 100"
            icon={<Percent className="h-4 w-4" />}
            trend={stats.netMargin >= 20 ? "up" : stats.netMargin >= 0 ? "neutral" : "down"}
          />
        </div>
      </div>

      {/* Sección: Beneficios y Márgenes */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Beneficios y Márgenes
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Beneficio Bruto"
            value={formatCurrency(stats.grossProfit)}
            description="Solo venta - coste de producto"
            formula="Ventas de Productos - Coste de Productos"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={stats.grossProfit >= 0 ? "up" : "down"}
          />
          <MetricCard
            title="Margen Bruto"
            value={`${stats.grossMargin.toFixed(1)}%`}
            description="% beneficio solo producto"
            formula="(Beneficio Bruto / Ventas Productos) × 100"
            icon={<Percent className="h-4 w-4" />}
            trend={stats.grossMargin >= 30 ? "up" : stats.grossMargin >= 0 ? "neutral" : "down"}
          />
          <MetricCard
            title="Margen Solo Producto"
            value={`${stats.productOnlyMargin.toFixed(1)}%`}
            description="Sin considerar envío ni empaquetado"
            formula="((Precio Venta - Coste) / Precio Venta) × 100"
            icon={<Box className="h-4 w-4" />}
            trend={stats.productOnlyMargin >= 30 ? "up" : stats.productOnlyMargin >= 0 ? "neutral" : "down"}
          />
          <MetricCard
            title="Margen Completo"
            value={`${stats.fullMargin.toFixed(1)}%`}
            description="Con producto + envío + empaquetado"
            formula="(Beneficio Neto / Ventas Totales) × 100"
            icon={<Calculator className="h-4 w-4" />}
            trend={stats.fullMargin >= 20 ? "up" : stats.fullMargin >= 0 ? "neutral" : "down"}
          />
        </div>
      </div>

      {/* Sección: Desglose de Costes */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Desglose de Costes
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Coste de Productos"
            value={formatCurrency(stats.totalProductCost)}
            description={`${((stats.totalProductCost / stats.totalCosts) * 100 || 0).toFixed(1)}% del coste total`}
            formula="Σ (Coste unitario × Cantidad) de todos los items"
            icon={<Package className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Coste de Envíos"
            value={formatCurrency(stats.totalShippingCost)}
            description={`${((stats.totalShippingCost / stats.totalCosts) * 100 || 0).toFixed(1)}% del coste total`}
            formula="Σ Coste de envío de cada pedido"
            icon={<Truck className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Coste de Empaquetado"
            value={formatCurrency(stats.totalPackagingCost)}
            description={`${((stats.totalPackagingCost / stats.totalCosts) * 100 || 0).toFixed(1)}% del coste total`}
            formula="Coste empaquetado × Número de pedidos"
            icon={<Box className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Coste Envío vs Ingreso"
            value={`${stats.shippingCostVsRevenue.toFixed(1)}%`}
            description="% del coste sobre lo cobrado"
            formula="(Coste Envío / Ingresos Envío) × 100"
            icon={<Truck className="h-4 w-4" />}
            trend={stats.shippingCostVsRevenue <= 80 ? "up" : stats.shippingCostVsRevenue <= 100 ? "neutral" : "down"}
          />
        </div>
      </div>

      {/* Sección: Métricas por Pedido */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Métricas por Pedido
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ticket Medio"
            value={formatCurrency(stats.averageOrderValue)}
            description="Valor medio por pedido"
            formula="Ventas Totales / Número de Pedidos"
            icon={<Receipt className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Coste Producto/Pedido"
            value={formatCurrency(stats.averageProductCostPerOrder)}
            description="Coste medio de productos"
            formula="Coste Total Productos / Número de Pedidos"
            icon={<Package className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Coste Envío/Pedido"
            value={formatCurrency(stats.averageShippingCostPerOrder)}
            description="Coste medio de envío"
            formula="Coste Total Envíos / Número de Pedidos"
            icon={<Truck className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Beneficio/Pedido"
            value={formatCurrency(stats.profitPerOrder)}
            description="Beneficio medio por pedido"
            formula="Beneficio Neto / Número de Pedidos"
            icon={stats.profitPerOrder >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            trend={stats.profitPerOrder >= 0 ? "up" : "down"}
          />
        </div>
      </div>

      {/* Sección: Ingresos Desglosados */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Ingresos Desglosados
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Ventas de Productos"
            value={formatCurrency(stats.productSales)}
            description="Ingresos solo por productos"
            formula="Σ Precio de venta de todos los items"
            icon={<Package className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Ingresos por Envío"
            value={formatCurrency(stats.shippingSales)}
            description="Lo que pagan los clientes"
            formula="Σ Coste de envío cobrado al cliente"
            icon={<Truck className="h-4 w-4" />}
            trend="neutral"
          />
          <MetricCard
            title="Resultado Envíos"
            value={formatCurrency(stats.shippingSales - stats.totalShippingCost)}
            description="Diferencia entre cobrado y pagado"
            formula="Ingresos Envío - Coste Envío"
            icon={stats.shippingSales - stats.totalShippingCost >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            trend={stats.shippingSales - stats.totalShippingCost >= 0 ? "up" : "down"}
          />
        </div>
      </div>

      {/* Alertas */}
      {hasAlerts && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alertas de Costes Incompletos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-3">
              Estos datos pueden afectar la precisión de los cálculos de rentabilidad
            </CardDescription>
            <div className="flex flex-wrap gap-4 text-sm">
              {stats.ordersWithMissingCosts > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900 px-3 py-1.5 rounded-md">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{stats.ordersWithMissingCosts}</strong> pedidos con productos sin coste
                  </span>
                </div>
              )}
              {stats.productsMissingCosts > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900 px-3 py-1.5 rounded-md">
                  <Box className="h-4 w-4 text-amber-600" />
                  <span>
                    <strong>{stats.productsMissingCosts}</strong> productos sin coste configurado
                  </span>
                </div>
              )}
              {stats.shippingMethodsMissingCosts > 0 && (
                <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900 px-3 py-1.5 rounded-md">
                  <Truck className="h-4 w-4 text-amber-600" />
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
