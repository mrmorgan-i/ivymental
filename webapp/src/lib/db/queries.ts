import { and, between, count, desc, eq, sql } from "drizzle-orm";
import { db } from ".";
import { aspects, channels, comments, runs, videos } from "./schema";

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getOverallSentimentCounts() {
  const rows = await db
    .select({
      sentiment: comments.sentiment,
      count: count(),
    })
    .from(comments)
    .groupBy(comments.sentiment);

  const result = { positive: 0, neutral: 0, negative: 0, mixed: 0, total: 0 };
  for (const row of rows) {
    if (row.sentiment === "positive") result.positive = row.count;
    else if (row.sentiment === "neutral") result.neutral = row.count;
    else if (row.sentiment === "negative") result.negative = row.count;
    else if (row.sentiment === "mixed") result.mixed = row.count;
    result.total += row.count;
  }
  return result;
}

export async function getPerChannelSentimentCounts() {
  const rows = await db
    .select({
      handle: comments.channelHandle,
      sentiment: comments.sentiment,
      count: count(),
    })
    .from(comments)
    .groupBy(comments.channelHandle, comments.sentiment);

  const channelMap = new Map<
    string,
    { handle: string; positive: number; neutral: number; negative: number }
  >();

  for (const row of rows) {
    if (!channelMap.has(row.handle)) {
      channelMap.set(row.handle, {
        handle: row.handle,
        positive: 0,
        neutral: 0,
        negative: 0,
      });
    }
    const entry = channelMap.get(row.handle)!;
    if (
      row.sentiment === "positive" ||
      row.sentiment === "neutral" ||
      row.sentiment === "negative"
    ) {
      entry[row.sentiment] = row.count;
    }
  }

  return Array.from(channelMap.values());
}

export async function getRecentRuns(limit = 10) {
  return db
    .select()
    .from(runs)
    .orderBy(desc(runs.startedAt))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export async function getChannelStats() {
  const rows = await db
    .select({
      handle: channels.handle,
      title: channels.title,
    })
    .from(channels);

  const sentimentRows = await db
    .select({
      handle: comments.channelHandle,
      sentiment: comments.sentiment,
      count: count(),
    })
    .from(comments)
    .groupBy(comments.channelHandle, comments.sentiment);

  return rows.map((ch) => {
    const sentiments = sentimentRows.filter((r) => r.handle === ch.handle);
    const total = sentiments.reduce((sum, r) => sum + r.count, 0);
    const positive =
      sentiments.find((r) => r.sentiment === "positive")?.count ?? 0;
    const neutral =
      sentiments.find((r) => r.sentiment === "neutral")?.count ?? 0;
    const negative =
      sentiments.find((r) => r.sentiment === "negative")?.count ?? 0;

    return {
      handle: ch.handle,
      title: ch.title,
      totalComments: total,
      positive,
      neutral,
      negative,
      positiveRatio: total > 0 ? positive / total : 0,
      neutralRatio: total > 0 ? neutral / total : 0,
      negativeRatio: total > 0 ? negative / total : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Channel detail
// ---------------------------------------------------------------------------

export async function getChannel(handle: string) {
  const rows = await db
    .select()
    .from(channels)
    .where(eq(channels.handle, handle))
    .limit(1);
  return rows[0] ?? null;
}

export async function getChannelSentimentByRun(
  handle: string,
  from?: Date,
  to?: Date,
) {
  const conditions = [eq(comments.channelHandle, handle)];
  if (from) conditions.push(between(comments.scoredAt, from, to ?? new Date()));

  const rows = await db
    .select({
      runId: comments.runId,
      sentiment: comments.sentiment,
      count: count(),
    })
    .from(comments)
    .where(and(...conditions))
    .groupBy(comments.runId, comments.sentiment);

  const runMap = new Map<
    string,
    {
      runId: string;
      positive: number;
      neutral: number;
      negative: number;
      total: number;
    }
  >();

  for (const row of rows) {
    if (!row.runId) continue;
    if (!runMap.has(row.runId)) {
      runMap.set(row.runId, {
        runId: row.runId,
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
      });
    }
    const entry = runMap.get(row.runId)!;
    if (
      row.sentiment === "positive" ||
      row.sentiment === "neutral" ||
      row.sentiment === "negative"
    ) {
      entry[row.sentiment] = row.count;
    }
    entry.total += row.count;
  }

  // Join with runs table for timestamps
  const runIds = Array.from(runMap.keys());
  if (runIds.length === 0) return [];

  const runRows = await db
    .select({ runId: runs.runId, startedAt: runs.startedAt })
    .from(runs)
    .where(
      sql`${runs.runId} IN ${runIds}`,
    );

  const runDateMap = new Map(
    runRows.map((r) => [r.runId, r.startedAt]),
  );

  return Array.from(runMap.values())
    .map((r) => ({
      ...r,
      startedAt: runDateMap.get(r.runId) ?? null,
    }))
    .sort((a, b) => {
      if (!a.startedAt || !b.startedAt) return 0;
      return a.startedAt.getTime() - b.startedAt.getTime();
    });
}

export async function getTopComments(
  handle: string,
  sentiment: "positive" | "negative",
  limit = 10,
) {
  const confidenceCol =
    sentiment === "positive"
      ? comments.confidencePositive
      : comments.confidenceNegative;

  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.channelHandle, handle),
        eq(comments.sentiment, sentiment),
      ),
    )
    .orderBy(desc(confidenceCol))
    .limit(limit);
}

export async function getChannelAspects(handle: string) {
  const rows = await db
    .select({
      aspect: sql<string>`LOWER(${aspects.aspect})`.as("aspect"),
      sentiment: aspects.sentiment,
      count: count(),
    })
    .from(aspects)
    .innerJoin(comments, eq(aspects.commentId, comments.commentId))
    .where(eq(comments.channelHandle, handle))
    .groupBy(sql`LOWER(${aspects.aspect})`, aspects.sentiment);

  const aspectMap = new Map<
    string,
    { aspect: string; positive: number; negative: number; total: number }
  >();

  for (const row of rows) {
    if (!aspectMap.has(row.aspect)) {
      aspectMap.set(row.aspect, {
        aspect: row.aspect,
        positive: 0,
        negative: 0,
        total: 0,
      });
    }
    const entry = aspectMap.get(row.aspect)!;
    if (row.sentiment === "positive") entry.positive = row.count;
    if (row.sentiment === "negative") entry.negative = row.count;
    entry.total += row.count;
  }

  return Array.from(aspectMap.values()).sort((a, b) => b.total - a.total);
}

export async function getChannelVideos(handle: string) {
  return db
    .select()
    .from(videos)
    .where(eq(videos.channelHandle, handle))
    .orderBy(desc(videos.publishedAt));
}

export async function getNegativeCommentTexts(handle: string) {
  return db
    .select({ text: comments.text })
    .from(comments)
    .where(
      and(
        eq(comments.channelHandle, handle),
        eq(comments.sentiment, "negative"),
      ),
    );
}

// ---------------------------------------------------------------------------
// Video detail
// ---------------------------------------------------------------------------

export async function getVideo(videoId: string) {
  const rows = await db
    .select()
    .from(videos)
    .where(eq(videos.videoId, videoId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVideoComments(videoId: string) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.confidencePositive));
}

export async function getVideoSentimentCounts(videoId: string) {
  const rows = await db
    .select({
      sentiment: comments.sentiment,
      count: count(),
    })
    .from(comments)
    .where(eq(comments.videoId, videoId))
    .groupBy(comments.sentiment);

  const result = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
  for (const row of rows) {
    if (row.sentiment === "positive") result.positive = row.count;
    else if (row.sentiment === "neutral") result.neutral = row.count;
    else if (row.sentiment === "negative") result.negative = row.count;
    else if (row.sentiment === "mixed") result.mixed = row.count;
  }
  return result;
}

export async function getVideoAspects(videoId: string) {
  const rows = await db
    .select({
      aspect: sql<string>`LOWER(${aspects.aspect})`.as("aspect"),
      sentiment: aspects.sentiment,
      count: count(),
    })
    .from(aspects)
    .innerJoin(comments, eq(aspects.commentId, comments.commentId))
    .where(eq(comments.videoId, videoId))
    .groupBy(sql`LOWER(${aspects.aspect})`, aspects.sentiment);

  return rows;
}

export async function getChannelCount() {
  const rows = await db.select({ count: count() }).from(channels);
  return rows[0]?.count ?? 0;
}
