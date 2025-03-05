import { Switch } from "@/components/ui/switch";
import { trpc } from "@/trpc/client";

export const SwitchCell = ({
  id,
  isActive,
}: {
  id: number;
  isActive: boolean;
}) => {
  const utils = trpc.useUtils();
  const updateMutation = trpc.reviews.update.useMutation({
    onSuccess: () => {
      utils.reviews.getMany.invalidate();
    },
  });

  const handleCheckedChange = (value: boolean) => {
    updateMutation.mutate({
      id,
      isActive: value,
    });
  };

  return (
    <div className="w-full text-right">
      <Switch
        checked={isActive}
        onCheckedChange={handleCheckedChange}
        disabled={updateMutation.isPending}
      />
    </div>
  );
};
