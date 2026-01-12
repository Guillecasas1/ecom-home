# Sistema de Rentabilidad para WooCommerce

Este sistema te permite controlar la rentabilidad de tus pedidos de WooCommerce, calculando automáticamente costes y beneficios.

## 📋 Características

- **Recepción automática de pedidos** via webhook de WooCommerce
- **Gestión de costes de productos** con edición inline
- **Gestión de métodos de envío** (Nacex, Correos, otros)
- **Coste de empaquetado** configurable por pedido
- **Dashboard de rentabilidad** con estadísticas
- **Alertas** cuando hay productos o envíos sin coste asignado
- **Filtros por fecha** para análisis temporal
- **Tablas con TanStack Table** y shadcn/ui

## 🚀 Instalación

### 1. Copiar archivos

Copia los archivos a tu proyecto existente:

```bash
# Schemas de base de datos
cp src/db/schema/wc-orders.ts tu-proyecto/src/db/schema/
cp src/db/schema/wc-order-items.ts tu-proyecto/src/db/schema/
cp src/db/schema/products.ts tu-proyecto/src/db/schema/
cp src/db/schema/shipping-methods.ts tu-proyecto/src/db/schema/
cp src/db/schema/profitability-settings.ts tu-proyecto/src/db/schema/

# Módulo de rentabilidad
cp -r src/modules/profitability tu-proyecto/src/modules/

# Página del dashboard
cp -r src/app/\(admin\)/profitability tu-proyecto/src/app/\(admin\)/

# Webhook
cp -r src/app/api/webhooks/woocommerce/order-created tu-proyecto/src/app/api/webhooks/woocommerce/

# Utilidades (actualiza tu archivo existente)
# Añade las funciones formatCurrency, formatDate, etc. a tu lib/utils.ts

# Middleware (añade la nueva ruta pública)
# Añade "/api/webhooks/woocommerce/order-created" a publicPatterns
```

### 2. Actualizar src/db/schema/index.ts

Añade los exports de los nuevos schemas:

```typescript
// Profitability / Rentabilidad
export { default as wcOrders, wcOrdersRelations } from "./wc-orders";
export { default as wcOrderItems, wcOrderItemsRelations } from "./wc-order-items";
export { default as products, productsRelations } from "./products";
export { default as shippingMethods, shippingMethodsRelations } from "./shipping-methods";
export { default as profitabilitySettings } from "./profitability-settings";
```

### 3. Ejecutar migración

Opción A - Usar el archivo SQL directamente en Supabase:
```bash
# Ve a tu dashboard de Supabase > SQL Editor
# Ejecuta el contenido de drizzle/0002_profitability_tables.sql
```

Opción B - Usar Drizzle migrations:
```bash
pnpm run db:generate
pnpm run db:migrate
```

### 4. Instalar dependencias (si no las tienes)

```bash
pnpm add @tanstack/react-table date-fns react-day-picker
```

### 5. Configurar webhook en WooCommerce

1. Ve a **WooCommerce > Ajustes > Avanzado > Webhooks**
2. Crea un nuevo webhook:
   - **Nombre**: `Nuevo pedido - Rentabilidad`
   - **Estado**: Activo
   - **Tema**: `Pedido creado` (Order created)
   - **URL de entrega**: `https://tu-dominio.com/api/webhooks/woocommerce/order-created`
   - **Secreto**: El mismo valor que tienes en `WOOCOMMERCE_WEBHOOK_SECRET`
   - **Versión API**: `WP REST API Integration v3`

3. Guarda el webhook

## 📊 Uso

### Dashboard

Accede a `/admin/profitability` para ver:

- **Estadísticas generales**: Ventas, costes, beneficio y margen
- **Tabla de pedidos**: Con alerta si faltan costes
- **Tabla de productos**: Con edición inline de costes
- **Configuración**: Métodos de envío y coste de empaquetado

### Asignar costes a productos

1. Ve a la pestaña "Productos"
2. Los productos sin coste muestran un icono ⚠️
3. Haz clic en el icono de lápiz para editar el coste
4. El coste se aplica automáticamente a todos los pedidos existentes

### Configurar métodos de envío

1. Ve a la pestaña "Configuración"
2. En la sección "Métodos de Envío", edita el coste y proveedor de cada método
3. Los métodos se crean automáticamente cuando llega un pedido con un método nuevo

### Configurar coste de empaquetado

1. Ve a la pestaña "Configuración"
2. En la tarjeta "Coste de Empaquetado", edita el valor (por defecto 0.90€)
3. Este coste se suma automáticamente a cada pedido

## 🔄 Cálculo de rentabilidad

Para cada pedido:
```
Beneficio = Total Venta - (Coste Productos + Coste Envío + Coste Empaquetado)
Margen = (Beneficio / Total Venta) × 100
```

## ⚠️ Alertas

El sistema muestra alertas cuando:
- Un pedido tiene productos sin coste asignado
- Un pedido tiene un método de envío sin coste asignado
- Hay productos en el catálogo sin coste
- Hay métodos de envío activos sin coste

## 📁 Estructura de archivos

```
src/
├── app/
│   ├── (admin)/
│   │   └── profitability/
│   │       └── page.tsx              # Dashboard principal
│   └── api/
│       └── webhooks/
│           └── woocommerce/
│               └── order-created/
│                   └── route.ts      # Webhook para recibir pedidos
├── db/
│   └── schema/
│       ├── wc-orders.ts              # Tabla de pedidos
│       ├── wc-order-items.ts         # Tabla de items
│       ├── products.ts               # Tabla de productos con costes
│       ├── shipping-methods.ts       # Tabla de métodos de envío
│       └── profitability-settings.ts # Configuración
├── lib/
│   └── utils.ts                      # Funciones de formateo
└── modules/
    └── profitability/
        ├── actions/
        │   └── index.ts              # Server Actions
        ├── services/
        │   ├── dashboard-service.ts  # Lógica del dashboard
        │   ├── products-service.ts   # Gestión de productos
        │   └── shipping-service.ts   # Gestión de envíos
        ├── types/
        │   └── index.ts              # Tipos TypeScript
        └── ui/
            └── components/
                ├── orders-table.tsx
                ├── orders-columns.tsx
                ├── products-table.tsx
                ├── products-columns.tsx
                ├── shipping-methods-card.tsx
                ├── packaging-cost-card.tsx
                ├── stats-cards.tsx
                └── date-range-picker.tsx
```

## 🛠️ Personalización

### Añadir nuevos proveedores de envío

Edita `src/app/api/webhooks/woocommerce/order-created/route.ts` en la función `findOrCreateShippingMethod`:

```typescript
if (lowerMethodId.includes("seur") || lowerTitle.includes("seur")) {
  provider = "seur";
}
```

### Cambiar el coste de empaquetado por defecto

Edita `src/modules/profitability/types/index.ts`:

```typescript
export const DEFAULT_PACKAGING_COST = "1.20"; // Nuevo valor
```

## 📝 Notas

- Los costes de productos se actualizan retroactivamente en los pedidos existentes
- El webhook ignora pedidos duplicados (por `wc_order_id`)
- Los pedidos actualizados solo modifican el estado, no recrean los items
