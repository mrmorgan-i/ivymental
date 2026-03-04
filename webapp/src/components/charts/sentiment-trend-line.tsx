"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  positive: { label: "Positive %", color: "var(--color-chart-2)" },
  neutral: { label: "Neutral %", color: "var(--color-chart-4)" },
  negative: { label: "Negative %", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

interface SentimentTrendLineProps {
  data: Array<{
    runId: string;
    startedAt: Date | null;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }>;
}

export function SentimentTrendLine({ data }: SentimentTrendLineProps) {
  const chartData = data.map((d) => ({
    label: d.startedAt
      ? d.startedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : d.runId.slice(0, 10),
    positive: d.total > 0 ? Math.round((d.positive / d.total) * 100) : 0,
    neutral: d.total > 0 ? Math.round((d.neutral / d.total) * 100) : 0,
    negative: d.total > 0 ? Math.round((d.negative / d.total) * 100) : 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full sm:h-[300px]">
      <LineChart data={chartData} accessibilityLayer margin={{ left: -10, right: 10 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={35} tickFormatter={(v) => `${v}%`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="positive"
          stroke={chartConfig.positive.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke={chartConfig.neutral.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke={chartConfig.negative.color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
