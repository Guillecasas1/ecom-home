"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StockNotification } from "@/modules/mailing/types";
import { SendNowButton } from "./send-now-btn";

// Producto, variante, reservado desde, notificado, acciones

export const stockNotificationsListColumns: ColumnDef<StockNotification>[] = [
  {
    accessorKey: "productName",
    header: "Producto",
    cell: ({ row }) => {
      const notification = row.original;
      return (
        <div className="pl-2">
          <span>{notification.productName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "variant",
    header: "Variante",
    cell: ({ row }) => {
      const notification = row.original;
      return (
        <div className="pl-2">
          <span>{notification.variant}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    filterFn: 'includesString',
    cell: ({ row }) => {
      const automation = row.original;

      // Definir los datos del estado (texto y color)
      const statusData: Record<string, { text: string; color: string }> = {
        pending: {
          text: "pendiente",
          color: "bg-yellow-200 text-yellow-800",
        },
        paused: {
          text: "pausado",
          color: "bg-red-200 text-red-800",
        },
        completed: {
          text: "completado",
          color: "bg-green-200 text-green-800",
        },
      };

      // Obtener los datos del estado actual o usar un valor por defecto
      const currentStatus = statusData[automation.status as keyof typeof statusData] || {
        text: automation.status,
        color: "bg-gray-200 text-gray-800",
      };

      return (
        <div
          className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${currentStatus.color}`}
        >
          {currentStatus.text}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => {
      return (
        <div className="w-full pr-2 text-right">
          <span>Acciones</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const isMobile = useIsMobile();
      const automation = row.original;

      return (
        <div className="w-full pr-2 text-right">
          {!isMobile ? (
            <>
              <SendNowButton id={automation.id} status={automation.status} />
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {automation.status === "pending" && (
                  <DropdownMenuItem onClick={() => { }} className="cursor-pointer">
                    {/* {isProcessing ? "Procesando..." : "Enviar ahora"} */}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { }} className="cursor-pointer">
                  {automation.status === "paused" ? "Iniciar automatización" : "Pausar automatización"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    document.getElementById(`edit-dialog-trigger-${automation.id}`)?.click();
                  }}
                  className="cursor-pointer"
                >
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
  },
];
