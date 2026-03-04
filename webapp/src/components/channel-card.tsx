import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChannelCardProps {
  handle: string;
  title: string;
  totalComments: number;
  positive: number;
  neutral: number;
  negative: number;
}

export function ChannelCard({
  handle,
  title,
  totalComments,
  positive,
  neutral,
  negative,
}: ChannelCardProps) {
  const total = positive + neutral + negative;
  const pPct = total > 0 ? (positive / total) * 100 : 0;
  const nuPct = total > 0 ? (neutral / total) * 100 : 0;
  const nPct = total > 0 ? (negative / total) * 100 : 0;

  return (
    <Link href={`/channels/${encodeURIComponent(handle)}`}>
      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{handle}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {totalComments.toLocaleString()} comments analyzed
          </p>
          <div className="space-y-1.5">
            <div className="flex h-2 overflow-hidden rounded-full">
              <div
                className="bg-chart-2"
                style={{ width: `${pPct}%` }}
              />
              <div
                className="bg-chart-4"
                style={{ width: `${nuPct}%` }}
              />
              <div
                className="bg-chart-1"
                style={{ width: `${nPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(pPct)}% positive</span>
              <span>{Math.round(nuPct)}% neutral</span>
              <span>{Math.round(nPct)}% negative</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
