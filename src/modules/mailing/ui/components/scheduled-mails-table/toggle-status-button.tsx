import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ToggleStatusButton = ({
  id,
  status
}: {
  id: number;
  status: string;
}) => {
  const utils = trpc.useUtils();
  const toggleStatus = trpc.reviews.toggleStatus.useMutation({
    onSuccess: () => {
      utils.reviews.getMany.invalidate();
    },
  });

  const isPaused = status === "paused";

  const handleClick = () => {
    toggleStatus.mutate({
      id,
      newStatus: isPaused ? "pending" : "paused",
      isActive: isPaused
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={handleClick}
            className={`mr-2 hover:cursor-pointer ${isPaused ? "text-green-500" : "text-red-400"}`}
            title={isPaused ? "Iniciar automatización" : "Pausar automatización"}
          >
            {isPaused ? <IconPlayerPlay /> : <IconPlayerPause />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPaused ? "Iniciar automatización" : "Pausar automatización"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

  );
}