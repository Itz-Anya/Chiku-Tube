import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useChiku } from "@/lib/store";
import { formatDuration } from "@/lib/api";

export const Route = createFileRoute("/liked")({
  head: () => ({ meta: [{ title: "Liked Videos — Chiku Tube" }] }),
  component: LikedPage,
});

function LikedPage() {
  const liked = useChiku((s) => s.liked);

  return (
    <div>
      <div className="mb-6 px-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Liked Videos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {liked.length} video{liked.length === 1 ? "" : "s"} saved
        </p>
      </div>

      {liked.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Tap the heart on any video to save it here.
          </p>
          <Link
            to="/"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Find something to like
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {liked.map((v) => (
            <Link
              key={v.id}
              to="/watch"
              search={{ v: v.id }}
              className="group block"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted shadow-soft">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                />
                <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {formatDuration(v.durationSeconds)}
                </div>
              </div>
              <div className="mt-3 px-1">
                <p className="line-clamp-2 font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                  {v.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{v.channelName}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
