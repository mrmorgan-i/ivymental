export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoSentimentBar } from "@/components/charts/video-sentiment-bar";
import {
  getVideo,
  getVideoAspects,
  getVideoComments,
  getVideoSentimentCounts,
} from "@/lib/db/queries";
import type { comments } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Comment = InferSelectModel<typeof comments>;

const sentimentColors = {
  positive: "default",
  neutral: "secondary",
  negative: "destructive",
  mixed: "outline",
} as const;

interface VideoDetailPageProps {
  params: Promise<{ videoId: string }>;
}

export default async function VideoDetailPage({
  params,
}: VideoDetailPageProps) {
  const { videoId } = await params;
  const video = await getVideo(videoId);
  if (!video) notFound();

  const [sentimentCounts, videoComments, videoAspects] = await Promise.all([
    getVideoSentimentCounts(videoId),
    getVideoComments(videoId),
    getVideoAspects(videoId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <img
          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
          alt={video.title ?? video.videoId}
          className="aspect-video w-48 shrink-0 rounded-md object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">
            {video.title ?? video.videoId}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Channel:{" "}
            <Link
              href={`/channels/${encodeURIComponent(video.channelHandle)}`}
              className="underline hover:text-foreground"
            >
              {video.channelHandle}
            </Link>
          </p>
          <Button variant="ghost" size="sm" className="mt-1" asChild>
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Watch on YouTube
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoSentimentBar
            positive={sentimentCounts.positive}
            neutral={sentimentCounts.neutral}
            negative={sentimentCounts.negative}
          />
        </CardContent>
      </Card>

      {videoAspects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aspects Mentioned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {videoAspects.map((a, i) => (
                <Badge
                  key={`${a.aspect}-${a.sentiment}-${i}`}
                  variant={
                    a.sentiment === "positive"
                      ? "default"
                      : a.sentiment === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {a.aspect} ({a.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Comments ({videoComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videoComments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No comments for this video.
            </p>
          ) : (
            <div className="space-y-2">
              {videoComments.map((comment: Comment) => (
                <div
                  key={comment.commentId}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">
                      {comment.author ?? "Unknown"}
                    </span>
                    {comment.sentiment && (
                      <Badge variant={sentimentColors[comment.sentiment]}>
                        {comment.sentiment}
                      </Badge>
                    )}
                    {comment.likeCount != null && comment.likeCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {comment.likeCount} likes
                      </span>
                    )}
                  </div>
                  <p className="break-words text-muted-foreground">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
