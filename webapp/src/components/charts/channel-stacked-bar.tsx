"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  positive: { label: "Positive", color: "var(--color-chart-2)" },
  neutral: { label: "Neutral", color: "var(--color-chart-4)" },
  negative: { label: "Negative", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

interface ChannelStackedBarProps {
  data: Array<{
    handle: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
}

export function ChannelStackedBar({ data }: ChannelStackedBarProps) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full sm:h-[300px]">
      <BarChart data={data} accessibilityLayer margin={{ left: -10, right: 10 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="handle"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.replace("@", "")}
        />
        <YAxis tickLine={false} axisLine={false} width={35} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="positive"
          stackId="sentiment"
          fill={chartConfig.positive.color}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="neutral"
          stackId="sentiment"
          fill={chartConfig.neutral.color}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="negative"
          stackId="sentiment"
          fill={chartConfig.negative.color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
