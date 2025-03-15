import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEdit } from "@tabler/icons-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Automation } from "@/modules/mailing/types";
import { trpc } from "@/trpc/client";

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  status: z.string(),
  scheduledDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDialogProps {
  automation: Automation;
}

export const EditDialog = ({ automation }: EditDialogProps) => {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  // Convertir la fecha de string a Date para el calendario
  const scheduledDate = automation.triggerSettings?.scheduledDate
    ? new Date(automation.triggerSettings.scheduledDate)
    : undefined;

  // Preparar el formulario con los valores actuales
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: automation.id,
      name: automation.name || "",
      description: automation.description || "",
      status: automation.status || "",
      isActive: automation.isActive,
      scheduledDate: scheduledDate,
    },
  });

  // Mutation para actualizar la automatización
  const updateAutomation = trpc.reviews.update.useMutation({
    onSuccess: () => {
      utils.reviews.getMany.invalidate();
      setOpen(false);
    },
  });

  function onSubmit(values: FormValues) {
    // Preparar los datos para la actualización
    const { scheduledDate } = values;

    // Verificar si la fecha ha cambiado para mejorar rendimiento
    const currentDate = automation.triggerSettings?.scheduledDate
      ? new Date(automation.triggerSettings.scheduledDate).toISOString()
      : null;
    const newDate = scheduledDate ? scheduledDate.toISOString() : null;
    const dateHasChanged = currentDate !== newDate;

    // Preparar triggerSettings manteniendo los valores originales pero actualizando la fecha si cambió
    const updatedTriggerSettings = dateHasChanged
      ? {
          ...automation.triggerSettings,
          scheduledDate: newDate || automation.triggerSettings.scheduledDate,
        }
      : automation.triggerSettings;

    updateAutomation.mutate({
      id: automation.id,
      name: automation.name,
      description: automation.description || "",
      isActive: automation.isActive,
      status: automation.status,
      triggerSettings: updatedTriggerSettings,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="mr-2 text-blue-400"
                variant="outline"
                onClick={() => setOpen(true)}
                id={`edit-dialog-trigger-${automation.id}`}
              >
                <IconEdit size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar automatización</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar automatización</DialogTitle>
          <DialogDescription>Modifica los detalles de la automatización</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la automatización" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descripción de la automatización"
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {automation.triggerType === "order_completed" && (
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de envío</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="ml-2" disabled={updateAutomation.isPending}>
                {updateAutomation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
