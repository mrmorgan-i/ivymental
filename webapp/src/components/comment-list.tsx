"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { comments } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Comment = InferSelectModel<typeof comments>;

const sentimentColors = {
  positive: "default",
  neutral: "secondary",
  negative: "destructive",
  mixed: "outline",
} as const;

interface CommentListProps {
  positiveComments: Comment[];
  negativeComments: Comment[];
}

export function CommentList({
  positiveComments,
  negativeComments,
}: CommentListProps) {
  const [search, setSearch] = useState("");

  const filterComments = (list: Comment[]) =>
    search
      ? list.filter(
          (c) =>
            c.text.toLowerCase().includes(search.toLowerCase()) ||
            c.author?.toLowerCase().includes(search.toLowerCase()),
        )
      : list;

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search comments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Tabs defaultValue="positive">
        <TabsList>
          <TabsTrigger value="positive">
            Top Positive ({positiveComments.length})
          </TabsTrigger>
          <TabsTrigger value="negative">
            Top Negative ({negativeComments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="positive" className="space-y-2">
          <CommentItems comments={filterComments(positiveComments)} />
        </TabsContent>
        <TabsContent value="negative" className="space-y-2">
          <CommentItems comments={filterComments(negativeComments)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommentItems({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No comments found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div
          key={comment.commentId}
          className="rounded-md border p-3 text-sm"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">{comment.author ?? "Unknown"}</span>
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
  );
}
