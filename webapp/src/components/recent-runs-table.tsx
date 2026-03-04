import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { runs } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Run = InferSelectModel<typeof runs>;

interface RecentRunsTableProps {
  runs: Run[];
}

export function RecentRunsTable({ runs }: RecentRunsTableProps) {
  if (runs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pipeline runs yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run ID</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Started</TableHead>
          <TableHead className="text-right">Pulled</TableHead>
          <TableHead className="text-right">Scored</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell className="font-mono text-xs">
              {run.runId.slice(0, 19)}
            </TableCell>
            <TableCell>{run.channelHandle}</TableCell>
            <TableCell>
              {run.startedAt
                ? format(run.startedAt, "MMM d, yyyy HH:mm")
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              {run.commentsPulled ?? 0}
            </TableCell>
            <TableCell className="text-right">
              {run.commentsScored ?? 0}
            </TableCell>
            <TableCell>
              <Badge
                variant={run.status === "success" ? "default" : "destructive"}
              >
                {run.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
