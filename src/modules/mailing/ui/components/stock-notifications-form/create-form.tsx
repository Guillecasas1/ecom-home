"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { stockNotificationsSchema, type StockNotificationsForm } from "../../../validations/stock-notifications";

export const CreateStockNotificationForm = () => {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Preparar el formulario con valores iniciales
  const form = useForm<StockNotificationsForm>({
    resolver: zodResolver(stockNotificationsSchema),
    defaultValues: {
      productId: "",
      productName: "",
      productSku: "",
      variant: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const createNotification = trpc.stockNotifications.create.useMutation({
    onSuccess: () => {
      utils.stockNotifications.getMany.invalidate();
      setOpen(false);
      form.reset();
    },
  });

  function onSubmit (values: StockNotificationsForm) {
    // Convertir el ID del producto a número
    createNotification.mutate({
      productId: values.productId,
      productName: values.productName,
      productSku: values.productSku,
      variant: values.variant || undefined,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus />
          Nueva notificación
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir nueva notificación de stock</DialogTitle>
          <DialogDescription>
            Completa el formulario para añadir una nueva solicitud de notificación de stock
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Datos del producto */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Información del producto</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID de producto</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productSku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU del producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variante (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Talla, color, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datos del suscriptor */}
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium">Información del cliente</h3>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apellidos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="ml-2" disabled={createNotification.isPending}>
                {createNotification.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 