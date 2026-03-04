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
      <h2 className="text-xl font-semibold">Failed to load channel</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Could not load channel data."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
