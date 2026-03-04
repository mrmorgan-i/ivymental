"use client";

import { Pie, PieChart } from "recharts";
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
  mixed: { label: "Mixed", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

interface SentimentPieChartProps {
  data: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };
}

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  const chartData = [
    { name: "positive", value: data.positive, fill: chartConfig.positive.color },
    { name: "neutral", value: data.neutral, fill: chartConfig.neutral.color },
    { name: "negative", value: data.negative, fill: chartConfig.negative.color },
    { name: "mixed", value: data.mixed, fill: chartConfig.mixed.color },
  ].filter((d) => d.value > 0);

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
