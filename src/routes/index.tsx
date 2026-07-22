import { createFileRoute } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Card, CardAction, CardContent } from "#/components/ui/card";
import Tiptap from "#/components/text-editor";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <Tiptap />
    </div>
  );
}
