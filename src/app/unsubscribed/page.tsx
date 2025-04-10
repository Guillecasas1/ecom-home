
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnsubscribedPage () {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-300">
      <div className="absolute inset-0 opacity-25 brightness-100 contrast-150" />
      <Card className="max-w-md z-10">
        <CardHeader>
          <CardTitle className="text-center">
            You have been unsubscribed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            You will no longer receive marketing emails from us. If this was a mistake or you change your mind, you can contact us to resubscribe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}