import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Heart, Loader2, AlertCircle } from "lucide-react";
import {
  fetchStream,
  searchAndResolve,
  fetchVideosByIds,
  getCachedVideo,
  isBroken,
  markBroken,
  type Video,
} from "@/lib/api";
import { CATALOG } from "@/lib/catalog";
import { generateRelatedKeywords } from "@/lib/ai.functions";
import { useChiku } from "@/lib/store";
import { cn } from "@/lib/utils";

const watchSearch = z.object({
  v: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/watch")({
  validateSearch: zodValidator(watchSearch),
  head: () => ({
    meta: [
      { title: "Watch — Chiku Tube" },
      { name: "description", content: "Watch videos on Chiku Tube." },
    ],
  }),
  component: WatchPage,
});

// Per-video related cache so back-nav doesn't refetch.
const relatedCache = new Map<string, Video[]>();

function WatchPage() {
  const { v: videoId } = Route.useSearch();
  const [video, setVideo] = useState<Video | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [related, setRelated] = useState<Video[]>([]);

  const toggleLike = useChiku((s) => s.toggleLike);
  const isLiked = useChiku((s) => s.isLiked);
  const playVideo = useChiku((s) => s.playVideo);
  const player = useChiku((s) => s.player);

  // Fetch video metadata (and stream URLs) for the requested id.
  // Reuses player/stream cache to avoid network when navigating back.
  useEffect(() => {
    if (!videoId) {
      setError("No video specified.");
      setLoadingVideo(false);
      return;
    }
    if (isBroken(videoId)) {
      setError("This video is unavailable.");
      setLoadingVideo(false);
      return;
    }
    // Player already has it loaded
    if (player.video && player.video.id === videoId) {
      setVideo(player.video);
      setLoadingVideo(false);
      return;
    }
    // Stream cache hit
    const cached = getCachedVideo(videoId);
    if (cached) {
      setVideo(cached);
      setLoadingVideo(false);
      playVideo(cached);
      return;
    }
    const ctl = new AbortController();
    setLoadingVideo(true);
    setError(null);
    setVideo(null);
    fetchStream(`https://youtu.be/${videoId}`, ctl.signal)
      .then((vid) => {
        setVideo(vid);
        setLoadingVideo(false);
        playVideo(vid);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        markBroken(videoId);
        setError((e as Error).message || "Stream unavailable");
        setLoadingVideo(false);
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Related — language-aware AI keywords → search-based resolution.
  // Cached per-video so back-nav doesn't refetch.
  useEffect(() => {
    if (!video) return;
    const cached = relatedCache.get(video.id);
    if (cached) {
      setRelated(cached.filter((r) => !isBroken(r.id)));
      return;
    }
    let cancelled = false;
    setRelated([]);
    (async () => {
      try {
        const ai = await generateRelatedKeywords({
          data: { title: video.title, channel: video.channelName },
        });
        const keywords = ai.keywords?.length
          ? ai.keywords
          : [video.title.split(/\s[-|–—]\s/)[0] || video.title];
        const all = await Promise.all(
          keywords.slice(0, 4).map((k) => searchAndResolve(k, 6).catch(() => [])),
        );
        const seen = new Set<string>([video.id]);
        const merged: Video[] = [];
        for (const list of all) {
          for (const r of list) {
            if (seen.has(r.id) || isBroken(r.id)) continue;
            seen.add(r.id);
            merged.push(r);
          }
        }
        if (merged.length >= 4) {
          relatedCache.set(video.id, merged);
          if (!cancelled) setRelated(merged.slice(0, 12));
          return;
        }
        // Fallback: curated catalog
        const pool = CATALOG.flatMap((s) => s.items).filter(
          (it) => it.id !== video.id && !isBroken(it.id),
        );
        const picks = pool.sort(() => Math.random() - 0.5).slice(0, 10);
        const fb = await fetchVideosByIds(picks);
        const final = [...merged, ...fb].slice(0, 12);
        relatedCache.set(video.id, final);
        if (!cancelled) setRelated(final);
      } catch {
        if (!cancelled) setRelated([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video?.id]);

  // Auto-play next: when current video ends OR errors, play next related.
  useEffect(() => {
    if (related.length === 0) return;
    const playNext = () => {
      const next = related.find((r) => !isBroken(r.id));
      if (!next) return;
      playVideo(next);
      window.history.replaceState(null, "", `/watch?v=${encodeURIComponent(next.id)}`);
    };
    window.addEventListener("chiku:videoended", playNext);
    window.addEventListener("chiku:videobroken", playNext);
    return () => {
      window.removeEventListener("chiku:videoended", playNext);
      window.removeEventListener("chiku:videobroken", playNext);
    };
  }, [related, playVideo]);

  const liked = video ? isLiked(video.id) : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <div id="player-slot" className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          {loadingVideo && (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingVideo && error && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-card text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Link
                to="/"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Back home
              </Link>
            </div>
          )}
        </div>

        {video && (
          <div className="mt-4 px-1">
            <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              {video.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {video.channelName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{video.channelName}</p>
                </div>
              </div>
              <button
                onClick={() =>
                  toggleLike({
                    id: video.id,
                    title: video.title,
                    channelName: video.channelName,
                    thumbnail: video.thumbnail,
                    youtubeUrl: video.youtubeUrl ?? "",
                    durationSeconds: video.durationSeconds,
                  })
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors",
                  liked
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-foreground hover:bg-accent",
                )}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                {liked ? "Liked" : "Like"}
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <h2 className="px-1 font-display text-base font-semibold tracking-tight text-foreground">
          Related
        </h2>
        {related.length === 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding related videos…
          </div>
        )}
        <div className="space-y-3">
          {related
            .filter((r) => !isBroken(r.id))
            .map((r) => (
              <Link
                key={r.id}
                to="/watch"
                search={{ v: r.id }}
                className="flex w-full gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-accent"
              >
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={r.thumbnail}
                    alt={r.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {r.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.channelName}</p>
                </div>
              </Link>
            ))}
        </div>
      </aside>
    </div>
  );
}
