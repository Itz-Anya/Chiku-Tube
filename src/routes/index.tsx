import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Play,
  Music2,
  Code2,
  Gamepad2,
  Utensils,
  Palmtree,
  Laugh,
  Brain,
  Flame,
  Mic,
  Tv,
  Heart,
  History as HistoryIcon,
} from "lucide-react";
import { Shelf } from "@/components/Shelf";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { CATALOG } from "@/lib/catalog";
import { useChiku } from "@/lib/store";
import { generateBecauseYouWatched, generateTrendingNow } from "@/lib/ai.functions";
import { searchVideos, isBroken, formatDuration, type Video } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chiku Tube — Discover what to watch" },
      {
        name: "description",
        content:
          "Personalized AI-powered video discovery with curated shelves, continue watching, and a beautiful custom player.",
      },
      { property: "og:title", content: "Chiku Tube — Discover what to watch" },
      {
        property: "og:description",
        content:
          "Personalized AI-powered video discovery with a beautiful, distraction-free player.",
      },
    ],
  }),
  component: HomePage,
});

// Module-level caches survive route transitions for instant back-nav.
let personalizedCache: { signature: string; keywords: string[]; videos: Video[] } | null = null;
let trendingCache: { videos: Video[]; ts: number } | null = null;
const TRENDING_TTL_MS = 10 * 60 * 1000; // refresh trending every 10 min

const MOOD_CHIPS: Array<{ label: string; query: string; Icon: typeof Music2 }> = [
  { label: "Lofi", query: "lofi hip hop radio", Icon: Music2 },
  { label: "Tech", query: "best tech reviews 2025", Icon: Code2 },
  { label: "Gaming", query: "top gaming highlights", Icon: Gamepad2 },
  { label: "Cooking", query: "easy recipes", Icon: Utensils },
  { label: "Travel", query: "travel vlog", Icon: Palmtree },
  { label: "Comedy", query: "stand up comedy", Icon: Laugh },
  { label: "Learn", query: "ted talk", Icon: Brain },
  { label: "Trending", query: "trending music videos", Icon: Flame },
  { label: "Podcasts", query: "best podcast clips", Icon: Mic },
  { label: "Documentary", query: "documentary", Icon: Tv },
];

function buildSignalSignature(items: Array<{ id: string; title: string; channelName: string }>) {
  return items.map((item) => `${item.id}:${item.title}:${item.channelName}`).join("|");
}

function buildFallbackQueries(items: Array<{ title: string; channelName: string }>) {
  const queries = new Set<string>();
  for (const item of items) {
    const title = item.title.replace(/\s+/g, " ").trim();
    const primary = title.split(/\s[-|–—]\s/)[0]?.trim();
    if (title.length >= 3) queries.add(title);
    if (primary && primary.length >= 3) queries.add(primary);
    if (item.channelName && item.channelName.length >= 3 && !/^unknown/i.test(item.channelName)) {
      queries.add(item.channelName.trim());
      if (primary && primary.length >= 3) queries.add(`${primary} ${item.channelName.trim()}`);
    }
  }
  return Array.from(queries).slice(0, 8);
}

function MoodChips() {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {MOOD_CHIPS.map(({ label, query, Icon }) => (
        <Link
          key={label}
          to="/search"
          search={{ q: query }}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground/90 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
          {label}
        </Link>
      ))}
    </div>
  );
}

function ContinueWatching() {
  const history = useChiku((s) => s.history);
  const playVideo = useChiku((s) => s.playVideo);

  const items = useMemo(() => {
    return history
      .filter(
        (h) =>
          h.watchedSeconds > 5 &&
          h.durationSeconds > 0 &&
          h.watchedSeconds < h.durationSeconds * 0.95 &&
          !isBroken(h.id),
      )
      .slice(0, 8);
  }, [history]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          <Play className="h-4 w-4 fill-primary text-primary" />
          Continue watching
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">Pick up where you left off</p>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, i) => {
          const pct = Math.min(
            100,
            Math.max(2, Math.round((it.watchedSeconds / Math.max(1, it.durationSeconds)) * 100)),
          );
          const remaining = Math.max(0, it.durationSeconds - it.watchedSeconds);
          return (
            <motion.button
              key={it.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.03 }}
              onClick={() => {
                playVideo({
                  id: it.id,
                  title: it.title,
                  channelName: it.channelName,
                  thumbnail: it.thumbnail,
                  duration: String(it.durationSeconds),
                  durationSeconds: it.durationSeconds,
                  isLive: false,
                  youtubeUrl: it.youtubeUrl,
                });
              }}
              className="group relative w-[260px] shrink-0 overflow-hidden rounded-2xl bg-card text-left shadow-soft transition-shadow hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[300px]"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={it.thumbnail}
                  alt={it.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded-full bg-primary/90 p-3 text-primary-foreground shadow-elevated">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                  {formatDuration(remaining)} left
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {it.title}
                </h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">{it.channelName}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

function WatchAgain() {
  const history = useChiku((s) => s.history);
  const playVideo = useChiku((s) => s.playVideo);

  const items = useMemo(() => {
    return history
      .filter(
        (h) =>
          h.durationSeconds > 0 &&
          h.watchedSeconds >= h.durationSeconds * 0.9 &&
          !isBroken(h.id),
      )
      .slice(0, 10);
  }, [history]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          <HistoryIcon className="h-4 w-4 text-primary" />
          Watch again
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">Recent finishes</p>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, i) => (
          <motion.button
            key={it.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.03 }}
            onClick={() =>
              playVideo({
                id: it.id,
                title: it.title,
                channelName: it.channelName,
                thumbnail: it.thumbnail,
                duration: String(it.durationSeconds),
                durationSeconds: it.durationSeconds,
                isLive: false,
                youtubeUrl: it.youtubeUrl,
              })
            }
            className="group relative w-[220px] shrink-0 overflow-hidden rounded-2xl bg-card text-left shadow-soft transition-shadow hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[260px]"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              <img
                src={it.thumbnail}
                alt={it.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-primary/90 p-2.5 text-primary-foreground shadow-elevated">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                {it.title}
              </h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">{it.channelName}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// Module-level cache for liked-derived picks.
let likedPicksCache: { signature: string; videos: Video[] } | null = null;

function LikedPicks() {
  const liked = useChiku((s) => s.liked);
  const [videos, setVideos] = useState<Video[] | null>(likedPicksCache?.videos ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (liked.length === 0) {
      setVideos(null);
      return;
    }
    const top = liked.slice(0, 4);
    const signature = top.map((l) => l.id).join("|");
    if (likedPicksCache?.signature === signature) {
      setVideos(likedPicksCache.videos);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const queries = Array.from(
        new Set(
          top
            .map((l) => l.title.split(/\s[-|–—]\s/)[0]?.trim())
            .filter((q): q is string => !!q && q.length >= 3),
        ),
      ).slice(0, 4);
      const lists = await Promise.all(
        queries.map(async (q) => {
          try {
            return await searchVideos(q, 4);
          } catch {
            return [];
          }
        }),
      );
      const seen = new Set<string>(top.map((l) => l.id));
      const merged: Video[] = [];
      const maxLen = Math.max(...lists.map((l) => l.length), 0);
      for (let i = 0; i < maxLen; i++) {
        for (const l of lists) {
          const v = l[i];
          if (!v || seen.has(v.id) || isBroken(v.id)) continue;
          seen.add(v.id);
          merged.push(v);
        }
      }
      const final = merged.slice(0, 8);
      likedPicksCache = { signature, videos: final };
      if (!cancelled) {
        setVideos(final);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liked]);

  if (liked.length === 0) return null;
  const visible = videos?.filter((v) => !isBroken(v.id)) ?? null;
  if (visible !== null && visible.length === 0 && !loading) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          More like what you loved
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">From your liked videos</p>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible === null || loading
          ? Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)
          : visible.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
      </div>
    </section>
  );
}

function HomePage() {
  const history = useChiku((s) => s.history);
  const liked = useChiku((s) => s.liked);

  const [aiVideos, setAiVideos] = useState<Video[] | null>(personalizedCache?.videos ?? null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiKeywords, setAiKeywords] = useState<string[]>(personalizedCache?.keywords ?? []);
  const [aiNonce, setAiNonce] = useState(0);

  const [trending, setTrending] = useState<Video[] | null>(trendingCache?.videos ?? null);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Bumped on every mount → shelves reshuffle so the feed always looks fresh.
  const [shelfShuffleKey] = useState(() => Date.now());

  const [, forceRerender] = useState(0);

  // Always invalidate cached recommendations + trending on a fresh page mount
  // so the feed shows new picks at every refresh.
  useEffect(() => {
    personalizedCache = null;
    trendingCache = null;
    likedPicksCache = null;
    setAiVideos(null);
    setTrending(null);
    setAiNonce((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render when a video is marked broken so we can hide it from the grid.
  useEffect(() => {
    const onBroken = () => forceRerender((n) => n + 1);
    window.addEventListener("chiku:videobroken", onBroken);
    return () => window.removeEventListener("chiku:videobroken", onBroken);
  }, []);

  // ── Personalized "Recommended for you" ──────────────────────────────────────
  useEffect(() => {
    const recentItems = [
      ...liked.slice(0, 6).map((l) => ({ id: l.id, title: l.title, channelName: l.channelName })),
      ...history.slice(0, 8).map((h) => ({ id: h.id, title: h.title, channelName: h.channelName })),
    ];
    const recent = recentItems.map((item) => item.title).filter(Boolean);
    const signature = buildSignalSignature(recentItems);

    if (recent.length === 0 || !signature) {
      setAiVideos(null);
      setAiKeywords([]);
      setAiError(null);
      return;
    }

    // Use in-memory cache when nonce hasn't changed (refresh button bumps it).
    if (
      aiNonce === 0 &&
      personalizedCache?.signature === signature &&
      personalizedCache.videos.some((video) => !isBroken(video.id))
    ) {
      setAiVideos(personalizedCache.videos);
      setAiKeywords(personalizedCache.keywords);
      return;
    }

    // Try persisted cache (only when not manually refreshing).
    if (aiNonce === 0 && typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(`chiku:discover:${signature}`);
        if (raw) {
          const parsed = JSON.parse(raw) as { keywords?: string[]; videos?: Video[]; ts?: number };
          const fresh = parsed.ts && Date.now() - parsed.ts < 24 * 60 * 60 * 1000;
          const cachedVideos = (parsed.videos ?? []).filter((video) => !isBroken(video.id));
          if (fresh && cachedVideos.length > 0) {
            const cachedKeywords = parsed.keywords ?? [];
            personalizedCache = { signature, keywords: cachedKeywords, videos: cachedVideos };
            setAiVideos(cachedVideos);
            setAiKeywords(cachedKeywords);
            return;
          }
        }
      } catch {
        /* ignore malformed cache */
      }
    }

    let cancelled = false;
    setAiLoading(true);
    setAiError(null);
    (async () => {
      try {
        const likedTitles = liked.slice(0, 6).map((l) => l.title);
        console.info(
          "[chiku] requesting AI keywords from",
          recent.length,
          "history +",
          likedTitles.length,
          "liked",
        );
        const res = await generateBecauseYouWatched({
          data: { recentTitles: recent, likedTitles },
        });
        const aiKw = (res.keywords ?? [])
          .map((k) => k.replace(/\s+/g, " ").trim())
          .filter((k) => k.length >= 3);
        const fbKw = buildFallbackQueries(recentItems);
        // Prefer AI when available, fall back to local-derived queries.
        const keywords = Array.from(new Set([...aiKw, ...fbKw])).slice(0, 8);
        console.info(
          "[chiku] AI keywords:",
          aiKw,
          "+ fallback:",
          fbKw,
          "→ using:",
          keywords,
          "error:",
          res.error,
        );
        if (keywords.length === 0) {
          if (!cancelled) {
            setAiVideos([]);
            setAiLoading(false);
            setAiError("No suggestions yet — keep watching to train your feed.");
          }
          return;
        }
        // Search each keyword in parallel; tolerate per-keyword failures.
        const lists = await Promise.all(
          keywords.slice(0, 6).map(async (k) => {
            try {
              const r = await searchVideos(k, 8);
              console.info(`[chiku] "${k}" → ${r.length} results`);
              return r;
            } catch (err) {
              console.warn(`[chiku] search failed for "${k}":`, err);
              return [];
            }
          }),
        );
        // Don't aggressively dedupe against history — if the user has watched
        // something recently we still want fresh related videos.
        const seen = new Set<string>();
        const merged: Video[] = [];
        const maxLen = Math.max(...lists.map((l) => l.length), 0);
        for (let i = 0; i < maxLen; i++) {
          for (const l of lists) {
            const v = l[i];
            if (!v) continue;
            if (seen.has(v.id) || isBroken(v.id)) continue;
            seen.add(v.id);
            merged.push(v);
          }
        }
        const final = merged.slice(0, 16).sort(() => Math.random() - 0.5);
        console.info("[chiku] personalized feed:", final.length, "videos");

        if (final.length === 0) {
          if (!cancelled) {
            setAiVideos([]);
            setAiLoading(false);
            setAiError("Couldn't find new picks right now. Try again in a moment.");
          }
          return;
        }

        personalizedCache = { signature, keywords, videos: final };
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              `chiku:discover:${signature}`,
              JSON.stringify({ keywords, videos: final, ts: Date.now() }),
            );
          } catch {
            /* ignore storage failures */
          }
        }
        if (!cancelled) {
          setAiVideos(final);
          setAiKeywords(keywords);
          setAiLoading(false);
        }
      } catch (err) {
        console.error("[chiku] personalized feed failed:", err);
        if (!cancelled) {
          setAiVideos([]);
          setAiLoading(false);
          setAiError("AI is taking a break. Tap refresh to try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length, liked.length, aiNonce]);

  // ── Trending Now (always shown, AI-curated) ─────────────────────────────────
  useEffect(() => {
    if (
      trendingCache &&
      Date.now() - trendingCache.ts < TRENDING_TTL_MS &&
      trendingCache.videos.some((v) => !isBroken(v.id))
    ) {
      setTrending(trendingCache.videos);
      return;
    }
    let cancelled = false;
    setTrendingLoading(true);
    (async () => {
      try {
        const hint =
          history
            .slice(0, 3)
            .map((h) => h.title.split(/\s[-|–—]\s/)[0])
            .filter(Boolean)
            .join(", ") || undefined;
        const res = await generateTrendingNow({ data: { hint } });
        const kw = (res.keywords ?? []).filter((k) => k && k.length >= 3).slice(0, 5);
        if (kw.length === 0) {
          if (!cancelled) {
            setTrending([]);
            setTrendingLoading(false);
          }
          return;
        }
        const lists = await Promise.all(
          kw.map(async (k) => {
            try {
              return await searchVideos(k, 4);
            } catch {
              return [];
            }
          }),
        );
        const seen = new Set<string>();
        const merged: Video[] = [];
        const maxLen = Math.max(...lists.map((l) => l.length), 0);
        for (let i = 0; i < maxLen; i++) {
          for (const l of lists) {
            const v = l[i];
            if (!v || seen.has(v.id) || isBroken(v.id)) continue;
            seen.add(v.id);
            merged.push(v);
          }
        }
        const final = merged.slice(0, 8).sort(() => Math.random() - 0.5);
        trendingCache = { videos: final, ts: Date.now() };
        if (!cancelled) {
          setTrending(final);
          setTrendingLoading(false);
        }
      } catch (err) {
        console.warn("[chiku] trending failed:", err);
        if (!cancelled) {
          setTrending([]);
          setTrendingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSignal = history.length > 0 || liked.length > 0;
  const baseTitles = CATALOG.map((s) => s.title);

  const handleRefreshAi = () => {
    if (typeof window !== "undefined") {
      // Clear all discover caches so it truly re-fetches.
      try {
        for (const k of Object.keys(window.localStorage)) {
          if (k.startsWith("chiku:discover:")) window.localStorage.removeItem(k);
        }
      } catch {
        /* ignore */
      }
    }
    personalizedCache = null;
    setAiVideos(null);
    setAiNonce((n) => n + 1);
  };

  return (
    <div className="space-y-10">
      {/* Hero header */}
      <div className="px-1">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Discover
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {hasSignal ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Personalized for you based on what you've watched
            </>
          ) : (
            "Hand-picked picks across tech, science, food, travel and more."
          )}
        </p>
      </div>

      {/* Mood chips for instant exploration */}
      <MoodChips />

      {/* Continue watching (only if any) */}
      <ContinueWatching />

      {/* Watch again — recently finished */}
      <WatchAgain />

      {/* Recommended for you */}
      {hasSignal &&
        (() => {
          const visible = aiVideos?.filter((v) => !isBroken(v.id)) ?? null;
          // Hide entirely if loaded but nothing left and no error message.
          if (visible !== null && visible.length === 0 && !aiLoading && !aiError) return null;
          return (
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Recommended for you
                </h2>
                <button
                  type="button"
                  onClick={handleRefreshAi}
                  disabled={aiLoading}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
                  title="Refresh recommendations"
                >
                  <RefreshCw className={cn(aiLoading && "animate-spin", "h-3 w-3")} />
                  Refresh
                </button>
              </div>
              {aiKeywords.length > 0 && !aiLoading && (
                <p className="mb-3 px-1 text-xs text-muted-foreground">
                  Because you watched:{" "}
                  <span className="text-foreground/80">{aiKeywords.slice(0, 3).join(" • ")}</span>
                </p>
              )}
              {aiError && visible !== null && visible.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  {aiError}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visible === null || aiLoading
                    ? Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
                    : visible.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
                </div>
              )}
            </section>
          );
        })()}

      {/* Liked-derived picks */}
      <LikedPicks />

      {/* Trending Now (AI-curated, shown to everyone) */}
      {(() => {
        const visible = trending?.filter((v) => !isBroken(v.id)) ?? null;
        if (visible !== null && visible.length === 0 && !trendingLoading) return null;
        return (
          <section>
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                <Flame className="h-4 w-4 text-orange-500" />
                Trending now
              </h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                What people are watching
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible === null || trendingLoading
                ? Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)
                : visible.map((v, i) => <VideoCard key={v.id} video={v} index={i} />)}
            </div>
          </section>
        );
      })()}

      {/* Curated catalog shelves */}
      <div className="space-y-12">
        {baseTitles.map((title) => (
          <Shelf key={title} title={title} shuffleKey={shelfShuffleKey} />
        ))}
      </div>
    </div>
  );
}
