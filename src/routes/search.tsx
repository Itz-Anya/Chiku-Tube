import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { searchVideos, fetchVideosByIds, isBroken, type Video } from "@/lib/api";
import { CATALOG } from "@/lib/catalog";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: ({ match }) => {
    const q = (match.search as { q?: string }).q || "";
    return {
      meta: [
        { title: q ? `${q} — Chiku Tube` : "Search — Chiku Tube" },
        { name: "description", content: `Search results for "${q}" on Chiku Tube.` },
      ],
    };
  },
  component: SearchPage,
});

// Module-level cache so back-navigation is instant.
const pageCache = new Map<string, Video[]>();

function SearchPage() {
  const { q } = Route.useSearch();
  const [results, setResults] = useState<Video[] | null>(() => pageCache.get(q) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    // Cache hit — skip the network entirely.
    const cached = pageCache.get(q);
    if (cached) {
      setResults(cached.filter((v) => !isBroken(v.id)));
      return;
    }
    const ctl = new AbortController();
    setResults(null);
    setError(null);

    (async () => {
      try {
        const apiResults = await searchVideos(q, 20, ctl.signal);
        if (apiResults.length > 0) {
          pageCache.set(q, apiResults);
          setResults(apiResults);
          return;
        }
        // Fallback: fuzzy match curated catalog
        const lower = q.toLowerCase();
        const matches = CATALOG.flatMap((s) =>
          s.items.map((it) => ({ ...it, shelf: s.title })),
        ).filter(
          (it) =>
            it.channel?.toLowerCase().includes(lower) || it.shelf.toLowerCase().includes(lower),
        );
        const pool =
          matches.length > 0
            ? matches
            : CATALOG.flatMap((s) => s.items)
                .sort(() => Math.random() - 0.5)
                .slice(0, 12);
        const resolved = await fetchVideosByIds(pool.slice(0, 16), ctl.signal);
        pageCache.set(q, resolved);
        setResults(resolved);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      }
    })();

    return () => ctl.abort();
  }, [q]);

  return (
    <div>
      <div className="mb-6 px-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Results for</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {q || "—"}
        </h1>
      </div>

      {results === null && q && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {results && results.length === 0 && q && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No results found for "{q}".
        </div>
      )}

      {!q && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4" /> Type in the search bar above to find videos.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results
            .filter((v) => !isBroken(v.id))
            .map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}
