import { useEffect, useState } from "react";
import { fetchVideosByIds, isBroken, type Video } from "@/lib/api";
import { getShelfByTitle } from "@/lib/catalog";
import { VideoCard, VideoCardSkeleton } from "./VideoCard";

interface ShelfProps {
  title: string;
  /** Bumping this re-shuffles the visible items so the feed feels fresh. */
  shuffleKey?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A grid of videos for one curated shelf. Resolves real YouTube IDs from the
 * catalog via the working /Url endpoint.
 */
export function Shelf({ title, shuffleKey = 0 }: ShelfProps) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const ctl = new AbortController();
    setVideos(null);
    setError(null);

    const shelf = getShelfByTitle(title);
    if (!shelf) {
      setVideos([]);
      return () => ctl.abort();
    }

    fetchVideosByIds(shelf.items, ctl.signal)
      .then((v) => setVideos(shuffle(v)))
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      });
    return () => ctl.abort();
  }, [title, shuffleKey]);

  // Re-render when a video gets marked broken so we can hide its card.
  useEffect(() => {
    const onBroken = () => force((n) => n + 1);
    window.addEventListener("chiku:videobroken", onBroken);
    return () => window.removeEventListener("chiku:videobroken", onBroken);
  }, []);

  const visible = videos?.filter((v) => !isBroken(v.id)) ?? null;

  // If everything in this shelf is broken/empty, hide the whole section.
  if (visible !== null && visible.length === 0 && !error) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
      </div>

      {error && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Couldn't load this shelf.
        </p>
      )}

      {!error && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible === null
            ? Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : visible.map((v, i) => <VideoCard key={`${v.id}-${i}`} video={v} index={i} />)}
        </div>
      )}
    </section>
  );
}
