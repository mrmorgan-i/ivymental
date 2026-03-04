import os
import json
import time
import logging
import datetime
from typing import Any, Dict, List, Optional

import azure.functions as func
import requests
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

app = func.FunctionApp()


@app.timer_trigger(
    schedule="0 0 2 * * 0",
    arg_name="mytimer",
    run_on_startup=False,
    use_monitor=True,
)
def yt_sentiment_timer(mytimer: func.TimerRequest) -> None:
    run_id = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%SZ")
    logging.info("Pipeline started. run_id=%s", run_id)

    yt_key            = _require_env("YOUTUBE_API_KEY")
    language_endpoint = _require_env("LANGUAGE_ENDPOINT").rstrip("/")
    language_key      = _require_env("LANGUAGE_KEY")
    database_url      = _require_env("DATABASE_URL")

    raw_handles       = _require_env("CHANNEL_HANDLES")
    channel_handles   = [h.strip() for h in raw_handles.split(",") if h.strip()]
    max_videos        = int(os.getenv("MAX_VIDEOS", "5"))
    max_comments      = int(os.getenv("MAX_COMMENTS_PER_VIDEO", "100"))

    conn = psycopg2.connect(database_url)
    conn.autocommit = False

    try:
        for handle in channel_handles:
            try:
                _process_channel(
                    conn=conn,
                    run_id=run_id,
                    handle=handle,
                    yt_key=yt_key,
                    language_endpoint=language_endpoint,
                    language_key=language_key,
                    max_videos=max_videos,
                    max_comments=max_comments,
                )
                conn.commit()
                logging.info("Committed results for channel: %s", handle)
            except Exception as exc:
                conn.rollback()
                logging.exception("Channel %s failed: %s", handle, exc)
        logging.info("Pipeline complete. run_id=%s", run_id)
    finally:
        conn.close()


def _process_channel(
    conn,
    run_id: str,
    handle: str,
    yt_key: str,
    language_endpoint: str,
    language_key: str,
    max_videos: int,
    max_comments: int,
) -> None:
    logging.info("Processing channel: %s", handle)

    channel = yt_get_channel_by_handle(yt_key, handle)
    channel_title    = channel["snippet"]["title"]
    uploads_playlist = channel["contentDetails"]["relatedPlaylists"]["uploads"]

    _upsert_channel(conn, handle, channel_title)

    video_ids = yt_get_latest_video_ids(yt_key, uploads_playlist, max_videos)
    logging.info("Found %d videos for %s", len(video_ids), handle)

    video_meta = yt_get_video_metadata(yt_key, video_ids)
    for vm in video_meta:
        _upsert_video(conn, vm, handle)

    all_comments: List[Dict[str, Any]] = []
    for vid in video_ids:
        comments = yt_get_comments_for_video(yt_key, vid, max_comments)
        logging.info("Pulled %d comments for video %s", len(comments), vid)
        all_comments.extend(comments)

    if not all_comments:
        logging.warning("No comments found for channel %s — skipping.", handle)
        _upsert_run(conn, run_id, handle, 0, 0, "success")
        return

    _upsert_comments_raw(conn, all_comments, handle)

    scored = 0
    aspect_rows: List[Dict[str, Any]] = []

    for chunk in _chunks(all_comments, 10):
        docs = [
            {"id": str(i), "language": "en", "text": (c.get("text") or "")[:5120]}
            for i, c in enumerate(chunk)
        ]
        lang_resp = language_sentiment(language_endpoint, language_key, docs)

        result_docs = lang_resp.get("results", {}).get("documents", [])
        errors = lang_resp.get("results", {}).get("errors", [])
        if errors:
            logging.warning(
                "Sentiment API returned %d errors: %s",
                len(errors),
                json.dumps(errors, default=str),
            )

        # Map by doc ID for safe matching
        doc_map = {doc["id"]: doc for doc in result_docs}

        for i, comment in enumerate(chunk):
            doc = doc_map.get(str(i))
            if not doc:
                logging.warning(
                    "No sentiment result for comment %s", comment["commentId"]
                )
                continue

            sentiment           = doc.get("sentiment")
            scores              = doc.get("confidenceScores", {})
            confidence_positive = scores.get("positive")
            confidence_neutral  = scores.get("neutral")
            confidence_negative = scores.get("negative")

            _update_comment_sentiment(
                conn,
                comment_id=comment["commentId"],
                sentiment=sentiment,
                confidence_positive=confidence_positive,
                confidence_neutral=confidence_neutral,
                confidence_negative=confidence_negative,
                run_id=run_id,
            )
            scored += 1

            for sentence in doc.get("sentences", []):
                for target in sentence.get("targets", []):
                    aspect_text = (target.get("text") or "").strip()
                    if not aspect_text:
                        continue
                    t_scores = target.get("confidenceScores", {})
                    aspect_rows.append({
                        "comment_id":          comment["commentId"],
                        "aspect":              aspect_text,
                        "sentiment":           target.get("sentiment"),
                        "confidence_positive": t_scores.get("positive"),
                        "confidence_negative": t_scores.get("negative"),
                    })

        time.sleep(0.2)

    if aspect_rows:
        _insert_aspects(conn, aspect_rows)

    _upsert_run(conn, run_id, handle, len(all_comments), scored, "success")
    logging.info(
        "Channel %s done. comments_pulled=%d scored=%d aspects=%d",
        handle, len(all_comments), scored, len(aspect_rows),
    )


def _upsert_channel(conn, handle: str, title: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO channels (handle, title)
            VALUES (%s, %s)
            ON CONFLICT (handle) DO UPDATE SET title = EXCLUDED.title
            """,
            (handle, title),
        )


def _upsert_video(conn, video_meta: Dict[str, Any], channel_handle: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO videos (video_id, channel_handle, title, published_at)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (video_id) DO UPDATE
                SET title        = EXCLUDED.title,
                    fetched_at   = NOW()
            """,
            (
                video_meta["video_id"],
                channel_handle,
                video_meta.get("title"),
                video_meta.get("published_at"),
            ),
        )


def _upsert_comments_raw(
    conn,
    comments: List[Dict[str, Any]],
    channel_handle: str,
) -> None:
    rows = [
        (
            c["commentId"],
            c["videoId"],
            channel_handle,
            c.get("author"),
            c.get("text", ""),
            c.get("likeCount", 0),
            c.get("publishedAt"),
        )
        for c in comments
    ]
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO comments
                (comment_id, video_id, channel_handle, author, text, like_count, published_at)
            VALUES %s
            ON CONFLICT (comment_id) DO UPDATE
                SET like_count = EXCLUDED.like_count
            """,
            rows,
        )


def _update_comment_sentiment(
    conn,
    comment_id: str,
    sentiment: Optional[str],
    confidence_positive: Optional[float],
    confidence_neutral: Optional[float],
    confidence_negative: Optional[float],
    run_id: str,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE comments
            SET sentiment           = %s,
                confidence_positive = %s,
                confidence_neutral  = %s,
                confidence_negative = %s,
                run_id              = %s,
                scored_at           = NOW()
            WHERE comment_id = %s
            """,
            (
                sentiment,
                confidence_positive,
                confidence_neutral,
                confidence_negative,
                run_id,
                comment_id,
            ),
        )


def _insert_aspects(conn, aspect_rows: List[Dict[str, Any]]) -> None:
    rows = [
        (
            r["comment_id"],
            r["aspect"],
            r["sentiment"],
            r["confidence_positive"],
            r["confidence_negative"],
        )
        for r in aspect_rows
    ]
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO aspects
                (comment_id, aspect, sentiment, confidence_positive, confidence_negative)
            VALUES %s
            """,
            rows,
        )


def _upsert_run(
    conn,
    run_id: str,
    channel_handle: str,
    comments_pulled: int,
    comments_scored: int,
    status: str,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO runs
                (run_id, channel_handle, comments_pulled, comments_scored, status)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (run_id, channel_handle) DO UPDATE
                SET comments_pulled = EXCLUDED.comments_pulled,
                    comments_scored = EXCLUDED.comments_scored,
                    status          = EXCLUDED.status
            """,
            (run_id, channel_handle, comments_pulled, comments_scored, status),
        )


def yt_get_channel_by_handle(yt_key: str, handle: str) -> Dict[str, Any]:
    normalized = handle if handle.startswith("@") else f"@{handle}"
    data = _yt_get(
        yt_key,
        "https://www.googleapis.com/youtube/v3/channels",
        {"part": "snippet,contentDetails", "forHandle": normalized},
    )
    items = data.get("items", [])
    if not items:
        raise RuntimeError(f"No channel found for handle: {handle}")
    return items[0]


def yt_get_latest_video_ids(
    yt_key: str, uploads_playlist_id: str, max_videos: int
) -> List[str]:
    video_ids: List[str] = []
    page_token: Optional[str] = None

    while len(video_ids) < max_videos:
        data = _yt_get(
            yt_key,
            "https://www.googleapis.com/youtube/v3/playlistItems",
            {
                "part": "contentDetails",
                "playlistId": uploads_playlist_id,
                "maxResults": 50,
                "pageToken": page_token,
            },
        )
        for item in data.get("items", []):
            vid = item.get("contentDetails", {}).get("videoId")
            if vid:
                video_ids.append(vid)
            if len(video_ids) >= max_videos:
                break
        page_token = data.get("nextPageToken")
        if not page_token:
            break
        time.sleep(0.1)

    return video_ids


def yt_get_video_metadata(
    yt_key: str, video_ids: List[str]
) -> List[Dict[str, Any]]:
    if not video_ids:
        return []
    data = _yt_get(
        yt_key,
        "https://www.googleapis.com/youtube/v3/videos",
        {"part": "snippet", "id": ",".join(video_ids)},
    )
    results = []
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        results.append({
            "video_id":     item["id"],
            "title":        snippet.get("title"),
            "published_at": snippet.get("publishedAt"),
        })
    return results


def yt_get_comments_for_video(
    yt_key: str, video_id: str, max_comments: int
) -> List[Dict[str, Any]]:
    comments: List[Dict[str, Any]] = []
    page_token: Optional[str] = None

    while len(comments) < max_comments:
        try:
            data = _yt_get(
                yt_key,
                "https://www.googleapis.com/youtube/v3/commentThreads",
                {
                    "part": "snippet",
                    "videoId": video_id,
                    "maxResults": 100,
                    "order": "time",
                    "pageToken": page_token,
                    "textFormat": "plainText",
                },
            )
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 403:
                logging.warning("Comments disabled for video %s — skipping.", video_id)
                break
            raise

        for item in data.get("items", []):
            top = item["snippet"]["topLevelComment"]["snippet"]
            comments.append({
                "videoId":    video_id,
                "commentId":  item["snippet"]["topLevelComment"]["id"],
                "publishedAt": top.get("publishedAt"),
                "author":     top.get("authorDisplayName"),
                "likeCount":  top.get("likeCount", 0),
                "text":       top.get("textDisplay", ""),
            })
            if len(comments) >= max_comments:
                break

        page_token = data.get("nextPageToken")
        if not page_token:
            break
        time.sleep(0.1)

    return comments


def _yt_get(
    yt_key: str, url: str, params: Dict[str, Any]
) -> Dict[str, Any]:
    p = {k: v for k, v in {**params, "key": yt_key}.items() if v is not None}
    resp = requests.get(url, params=p, timeout=30)
    resp.raise_for_status()
    return resp.json()


def language_sentiment(
    endpoint: str,
    key: str,
    documents: List[Dict[str, Any]],
    opinion_mining: bool = True,
) -> Dict[str, Any]:
    url = f"{endpoint}/language/:analyze-text?api-version=2025-11-01"
    headers = {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/json",
    }
    payload = {
        "kind": "SentimentAnalysis",
        "parameters": {"opinionMining": bool(opinion_mining)},
        "analysisInput": {"documents": documents},
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()


def _require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val


def _chunks(items: List[Any], size: int) -> List[List[Any]]:
    return [items[i : i + size] for i in range(0, len(items), size)]
