import { createFileRoute } from "@tanstack/react-router";
import { Card, CardAction, CardContent } from "#/components/ui/card";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <Card className="mt-4 text-lg">
        <CardContent>
          Edit <code>src/routes/index.tsx</code> to get started.
        </CardContent>
        <CardAction>
          <Button variant={"ghost"}>Click</Button>
        </CardAction>
      </Card>
    </div>
  );
}
