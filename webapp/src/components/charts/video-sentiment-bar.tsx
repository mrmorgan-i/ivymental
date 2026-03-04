"use client";

interface VideoSentimentBarProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function VideoSentimentBar({
  positive,
  neutral,
  negative,
}: VideoSentimentBarProps) {
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pPct = (positive / total) * 100;
  const nuPct = (neutral / total) * 100;
  const nPct = (negative / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-4 overflow-hidden rounded-full">
        <div className="bg-chart-2" style={{ width: `${pPct}%` }} />
        <div className="bg-chart-4" style={{ width: `${nuPct}%` }} />
        <div className="bg-chart-1" style={{ width: `${nPct}%` }} />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{positive} positive ({Math.round(pPct)}%)</span>
        <span>{neutral} neutral ({Math.round(nuPct)}%)</span>
        <span>{negative} negative ({Math.round(nPct)}%)</span>
      </div>
    </div>
  );
}
