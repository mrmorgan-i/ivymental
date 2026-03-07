export const dynamic = "force-dynamic";

import { BarChart3, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentimentPieChart } from "@/components/charts/sentiment-pie-chart";
import { ChannelStackedBar } from "@/components/charts/channel-stacked-bar";
import { RecentRunsTable } from "@/components/recent-runs-table";
import {
  getChannelCount,
  getOverallSentimentCounts,
  getPerChannelSentimentCounts,
  getRecentRuns,
} from "@/lib/db/queries";

export default async function Home() {
  const [sentiment, channelSentiment, recentRuns, channelCount] =
    await Promise.all([
      getOverallSentimentCounts(),
      getPerChannelSentimentCounts(),
      getRecentRuns(10),
      getChannelCount(),
    ]);

  const positivePercent =
    sentiment.total > 0
      ? Math.round((sentiment.positive / sentiment.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          YouTube comment sentiment analysis dashboard
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Comments"
          value={sentiment.total.toLocaleString()}
          icon={<MessageSquare className="size-4 text-muted-foreground" />}
        />
        <StatCard
          title="Positive Rate"
          value={`${positivePercent}%`}
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
        />
        <StatCard
          title="Channels Tracked"
          value={channelCount.toString()}
          icon={<Users className="size-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pipeline Runs"
          value={recentRuns.length.toString()}
          icon={<BarChart3 className="size-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentPieChart data={sentiment} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentiment by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelStackedBar data={channelSentiment} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Pipeline Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentRunsTable runs={recentRuns} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
