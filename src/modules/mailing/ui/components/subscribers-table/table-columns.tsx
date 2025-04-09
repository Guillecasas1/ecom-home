"use client";

import { IconUserCheck, IconUserOff } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/trpc/client";

import type { Subscriber } from "../../../types";

export const subscribersListColumns: ColumnDef<Subscriber>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const subscriber = row.original;
      return (
        <div className="flex items-center gap-2">
          {subscriber.isActive ? (
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" title="Active" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" title="Unsubscribed" />
          )}
          <span className="font-medium">{subscriber.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => {
      const subscriber = row.original;
      const fullName = [subscriber.firstName, subscriber.lastName]
        .filter(Boolean)
        .join(" ");

      return <span>{fullName || "—"}</span>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const subscriber = row.original;
      return (
        <div
          className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${subscriber.isActive
            ? "bg-green-200 text-green-800"
            : "bg-red-200 text-red-800"
            }`}
        >
          {subscriber.isActive ? "Active" : "Unsubscribed"}
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const subscriber = row.original;
      return <span>{subscriber.source || "—"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Subscribed On",
    cell: ({ row }) => {
      const subscriber = row.original;
      return (
        <span>
          {subscriber.createdAt.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "unsubscribedAt",
    header: "Unsubscribed On",
    cell: ({ row }) => {
      const subscriber = row.original;
      return (
        <span>
          {subscriber.unsubscribedAt
            ? subscriber.unsubscribedAt.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            : "—"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const subscriber = row.original;
      const isMobile = useIsMobile();
      const utils = trpc.useUtils();

      const toggleSubscriptionMutation = subscriber.isActive
        ? trpc.subscribers.unsubscribe.useMutation({
          onSuccess: () => {
            utils.subscribers.getMany.invalidate();
            toast.success("Subscriber has been unsubscribed");
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        })
        : trpc.subscribers.resubscribe.useMutation({
          onSuccess: () => {
            utils.subscribers.getMany.invalidate();
            toast.success("Subscriber has been resubscribed");
          },
          onError: (error) => {
            toast.error(`Error: ${error.message}`);
          },
        });

      const handleToggleSubscription = () => {
        if (subscriber.isActive) {
          toggleSubscriptionMutation.mutate({
            id: subscriber.id,
            reason: "admin_action",
          });
        } else {
          toggleSubscriptionMutation.mutate({
            id: subscriber.id,
          });
        }
      };

      if (!isMobile) {
        return (
          <div className="flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSubscription}
                    disabled={toggleSubscriptionMutation.isPending}
                    className={subscriber.isActive ? "text-red-500" : "text-green-500"}
                  >
                    {subscriber.isActive ? <IconUserOff size={16} /> : <IconUserCheck size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {subscriber.isActive ? "Unsubscribe" : "Resubscribe"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleSubscription}>
                {subscriber.isActive ? "Unsubscribe" : "Resubscribe"}
              </DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];