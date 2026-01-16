"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchDashboardStats,
  fetchOrdersSummary,
  fetchPackagingCost,
  fetchProducts,
  fetchShippingMethods,
} from "@/modules/profitability/actions";
import { ShippingMethodWithStats } from "@/modules/profitability/services/shipping-service";
import type { ProductWithStats } from "@/modules/profitability/types";
import { DashboardStats, OrderSummary } from "@/modules/profitability/types";
import {
  DashboardCards,
  DateRangePicker,
  OrdersTable,
  PackagingCostCard,
  ProductsTable,
  ShippingMethodsCard
} from "@/modules/profitability/ui/components";

export default function ProfitabilityDashboardPage () {
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [packagingCost, setPackagingCost] = useState<number>(0.9);

  // Orders
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(20);

  // Products
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(20);
  const [productsOnlyWithoutCost, setProductsOnlyWithoutCost] = useState(false);
  const [productsSearch, setProductsSearch] = useState("");

  // Shipping
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodWithStats[]>([]);

  // Load data
  const loadStats = useCallback(() => {
    startTransition(async () => {
      const range = dateRange?.from && dateRange?.to
        ? { from: dateRange.from, to: dateRange.to }
        : undefined;

      const [statsData, packagingCostData] = await Promise.all([
        fetchDashboardStats(range),
        fetchPackagingCost(),
      ]);

      setStats(statsData);
      setPackagingCost(packagingCostData);
    });
  }, [dateRange]);

  const loadOrders = useCallback(() => {
    startTransition(async () => {
      const range = dateRange?.from && dateRange?.to
        ? { from: dateRange.from, to: dateRange.to }
        : undefined;

      const data = await fetchOrdersSummary(range, ordersPage, ordersPageSize);
      setOrders(data.orders);
      setOrdersTotal(data.total);
    });
  }, [dateRange, ordersPage, ordersPageSize]);

  const loadProducts = useCallback(() => {
    startTransition(async () => {
      const data = await fetchProducts({
        page: productsPage,
        pageSize: productsPageSize,
        onlyWithoutCost: productsOnlyWithoutCost,
        search: productsSearch || undefined,
      });
      setProducts(data.products);
      setProductsTotal(data.total);
    });
  }, [productsPage, productsPageSize, productsOnlyWithoutCost, productsSearch]);

  const loadShippingMethods = useCallback(() => {
    startTransition(async () => {
      const data = await fetchShippingMethods();
      setShippingMethods(data);
    });
  }, []);

  const refreshAll = useCallback(() => {
    loadStats();
    loadOrders();
    loadProducts();
    loadShippingMethods();
  }, [loadStats, loadOrders, loadProducts, loadShippingMethods]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // Reload when date range changes
  useEffect(() => {
    loadStats();
    loadOrders();
  }, [dateRange, loadStats, loadOrders]);

  // Reload orders when page changes
  useEffect(() => {
    loadOrders();
  }, [ordersPage, ordersPageSize, loadOrders]);

  // Reload products when filters change
  useEffect(() => {
    loadProducts();
  }, [productsPage, productsPageSize, productsOnlyWithoutCost, productsSearch, loadProducts]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rentabilidad</h1>
          <p className="text-muted-foreground">
            Analiza los costes y beneficios de tus pedidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button variant="outline" size="icon" onClick={refreshAll} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {stats && <DashboardCards stats={stats} />}

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTable
            data={orders}
            totalCount={ordersTotal}
            page={ordersPage}
            pageSize={ordersPageSize}
            onPageChange={setOrdersPage}
            onPageSizeChange={(size) => {
              setOrdersPageSize(size);
              setOrdersPage(1);
            }}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsTable
            data={products}
            totalCount={productsTotal}
            page={productsPage}
            pageSize={productsPageSize}
            onPageChange={setProductsPage}
            onPageSizeChange={(size) => {
              setProductsPageSize(size);
              setProductsPage(1);
            }}
            onlyWithoutCost={productsOnlyWithoutCost}
            onFilterChange={setProductsOnlyWithoutCost}
            searchQuery={productsSearch}
            onSearchChange={setProductsSearch}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PackagingCostCard
              currentCost={packagingCost}
              totalOrders={stats?.totalOrders || 0}
            />
          </div>
          <ShippingMethodsCard methods={shippingMethods} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
