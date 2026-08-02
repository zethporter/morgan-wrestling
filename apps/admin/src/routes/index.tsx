import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@morgan-wrestling/ui/components/ui/button";
import { Card, CardAction, CardContent } from "@morgan-wrestling/ui/components/ui/card";
import Tiptap from "@morgan-wrestling/ui/components/text-editor";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <Tiptap />
    </div>
  );
}
