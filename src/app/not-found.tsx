
import { Card, CardContent } from "@/components/ui/card";
import { IconFileUnknown } from "@tabler/icons-react";

export default function NotFound () {
  return (
    <Card className="mx-auto mt-4 max-w-md">
      <CardContent>
        <p className="flex items-center justify-center gap-2 text-2xl">
          <IconFileUnknown />
          This page cannot be found.
        </p>
      </CardContent>
    </Card>
  );
}
