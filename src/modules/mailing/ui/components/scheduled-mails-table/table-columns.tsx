"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SwitchCell } from "./switch-cell";

type EmailAutomation = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  triggerType: string;
  triggerSettings: unknown;
  status: string;
};

export const emailAutomationsListColumns: ColumnDef<EmailAutomation>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="ml-2 pl-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const automation = row.original;
      return (
        <div className="pl-2">
          <span>{automation.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "status",
    header: "Estado",
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
      const currentStatus = statusData[
        automation.status as keyof typeof statusData
      ] || {
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
    accessorKey: "is_active",
    header: () => {
      return (
        <div className="w-full text-right">
          <span>Is active</span>
        </div>
      );
    },
    cell: ({ row }) => {
      const automation = row.original;
      return <SwitchCell id={automation.id} isActive={automation.isActive} />;
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
      const wallet = row.original;

      return (
        <div className="w-full pr-2 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(wallet.id.toString())
                }
              >
                Copiar ID de wallet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a
                  className="w-full"
                  href={`/dashboard/wallet-tracker/${wallet.id}`}
                >
                  Editar
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
