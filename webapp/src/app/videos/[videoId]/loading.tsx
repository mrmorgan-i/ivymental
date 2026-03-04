import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-20 rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}
