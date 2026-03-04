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
  negative: { label: "Negative", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

interface AspectBarChartProps {
  data: Array<{
    aspect: string;
    positive: number;
    negative: number;
    total: number;
  }>;
}

export function AspectBarChart({ data }: AspectBarChartProps) {
  const topAspects = data.slice(0, 10);

  if (topAspects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No aspect data available.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full sm:h-[300px]">
      <BarChart data={topAspects} layout="vertical" accessibilityLayer margin={{ left: -10, right: 10 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="aspect"
          tickLine={false}
          axisLine={false}
          width={65}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="positive"
          stackId="sentiment"
          fill={chartConfig.positive.color}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="negative"
          stackId="sentiment"
          fill={chartConfig.negative.color}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
