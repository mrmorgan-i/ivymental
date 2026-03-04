import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[160px]" />
          <Skeleton className="h-9 w-[160px]" />
        </div>
      </div>
      <Skeleton className="h-[380px] rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg" />
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}
