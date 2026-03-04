import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const channels = pgTable("channels", {
  handle: text().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
});

export const channelsRelations = relations(channels, ({ many }) => ({
  videos: many(videos),
  comments: many(comments),
  runs: many(runs),
}));

export const videos = pgTable(
  "videos",
  {
    videoId: text("video_id").primaryKey(),
    channelHandle: text("channel_handle")
      .notNull()
      .references(() => channels.handle),
    title: text(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("videos_channel_handle_idx").on(t.channelHandle)],
);

export const videosRelations = relations(videos, ({ one, many }) => ({
  channel: one(channels, {
    fields: [videos.channelHandle],
    references: [channels.handle],
  }),
  comments: many(comments),
}));

export const comments = pgTable(
  "comments",
  {
    commentId: text("comment_id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.videoId),
    channelHandle: text("channel_handle")
      .notNull()
      .references(() => channels.handle),
    author: text(),
    text: text().notNull(),
    likeCount: integer("like_count").default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sentiment: text({ enum: ["positive", "neutral", "negative", "mixed"] }),
    confidencePositive: numeric("confidence_positive", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
    confidenceNeutral: numeric("confidence_neutral", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
    confidenceNegative: numeric("confidence_negative", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
    runId: text("run_id"),
    scoredAt: timestamp("scored_at", { withTimezone: true }),
  },
  (t) => [
    index("comments_video_id_idx").on(t.videoId),
    index("comments_channel_handle_idx").on(t.channelHandle),
    index("comments_sentiment_idx").on(t.sentiment),
    index("comments_run_id_idx").on(t.runId),
  ],
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.videoId],
  }),
  channel: one(channels, {
    fields: [comments.channelHandle],
    references: [channels.handle],
  }),
  aspects: many(aspects),
}));

export const aspects = pgTable(
  "aspects",
  {
    id: serial().primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.commentId),
    aspect: text().notNull(),
    sentiment: text({ enum: ["positive", "neutral", "negative", "mixed"] }),
    confidencePositive: numeric("confidence_positive", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
    confidenceNegative: numeric("confidence_negative", {
      precision: 5,
      scale: 4,
      mode: "number",
    }),
  },
  (t) => [index("aspects_comment_id_idx").on(t.commentId)],
);

export const aspectsRelations = relations(aspects, ({ one }) => ({
  comment: one(comments, {
    fields: [aspects.commentId],
    references: [comments.commentId],
  }),
}));

export const runs = pgTable(
  "runs",
  {
    id: serial().primaryKey(),
    runId: text("run_id").notNull(),
    channelHandle: text("channel_handle")
      .notNull()
      .references(() => channels.handle),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    commentsPulled: integer("comments_pulled"),
    commentsScored: integer("comments_scored"),
    status: text({ enum: ["success", "error"] }).default("success"),
  },
  (t) => [unique().on(t.runId, t.channelHandle)],
);

export const runsRelations = relations(runs, ({ one }) => ({
  channel: one(channels, {
    fields: [runs.channelHandle],
    references: [channels.handle],
  }),
}));
