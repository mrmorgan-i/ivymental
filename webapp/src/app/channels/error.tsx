"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Failed to load channels</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Could not connect to the database."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
