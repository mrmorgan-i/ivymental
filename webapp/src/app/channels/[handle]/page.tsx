export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentimentTrendLine } from "@/components/charts/sentiment-trend-line";
import { AspectBarChart } from "@/components/charts/aspect-bar-chart";
import { WordCloud } from "@/components/charts/word-cloud";
import { CommentList } from "@/components/comment-list";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  getChannel,
  getChannelAspects,
  getChannelSentimentByRun,
  getChannelVideos,
  getNegativeCommentTexts,
  getTopComments,
} from "@/lib/db/queries";

interface ChannelDetailPageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ChannelDetailPage({
  params,
  searchParams,
}: ChannelDetailPageProps) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle);
  const { from, to } = await searchParams;

  const channel = await getChannel(handle);
  if (!channel) notFound();

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const [sentimentByRun, aspects, positiveComments, negativeComments, negativeTexts, channelVideos] =
    await Promise.all([
      getChannelSentimentByRun(handle, fromDate, toDate),
      getChannelAspects(handle),
      getTopComments(handle, "positive", 15),
      getTopComments(handle, "negative", 15),
      getNegativeCommentTexts(handle),
      getChannelVideos(handle),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{channel.title}</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">{channel.handle}</p>
            <Button variant="ghost" size="sm" asChild>
              <a
                href={`https://www.youtube.com/${channel.handle}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                YouTube
              </a>
            </Button>
          </div>
        </div>
        <DateRangeFilter from={from} to={to} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {sentimentByRun.length > 0 ? (
            <SentimentTrendLine data={sentimentByRun} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Not enough run data to show trends.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aspect Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <AspectBarChart data={aspects} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Negative Comment Word Cloud</CardTitle>
          </CardHeader>
          <CardContent>
            <WordCloud texts={negativeTexts.map((t) => t.text)} />
          </CardContent>
        </Card>
      </div>

      {channelVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {channelVideos.map((video) => (
                <Link
                  key={video.videoId}
                  href={`/videos/${video.videoId}`}
                  className="group overflow-hidden rounded-md border transition-colors hover:border-foreground/20"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title ?? video.videoId}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-3 text-sm">
                    <p className="font-medium line-clamp-2">{video.title ?? video.videoId}</p>
                    {video.publishedAt && (
                      <p className="text-xs text-muted-foreground">
                        {video.publishedAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentList
            positiveComments={positiveComments}
            negativeComments={negativeComments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
