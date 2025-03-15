import { IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/trpc/client";

type SendNowButtonProps = {
  id: number;
  status: string;
};

export const SendNowButton = ({ id, status }: SendNowButtonProps) => {
  const utils = trpc.useUtils();

  const sendNowMutation = trpc.reviews.sendNow.useMutation({
    onSuccess: () => {
      utils.reviews.getMany.invalidate();
      toast.success("Email enviado correctamente");
    },
    onError: (error) => {
      console.error("Error al enviar el email:", error);
      toast.error(
        "Ha ocurrido un error al enviar el email. Por favor, inténtelo de nuevo en unos segundos."
      );
    },
  });

  // Solo activar para automatizaciones pendientes
  const isDisabled = status !== "pending" || sendNowMutation.isPending;

  const handleClick = () => {
    if (isDisabled) return;
    sendNowMutation.mutate({ id });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className={`hover:cursor-pointer ${isDisabled ? "text-gray-400" : "text-green-500"}`}
            variant="outline"
            onClick={handleClick}
            disabled={isDisabled}
            aria-label="Enviar ahora"
          >
            <IconSend size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{sendNowMutation.isPending ? "Enviando..." : "Enviar ahora"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
