import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Clock } from "lucide-react";
import { useChiku } from "@/lib/store";
import { formatDuration } from "@/lib/api";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Watch History — Chiku Tube" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useChiku((s) => s.history);
  const clearHistory = useChiku((s) => s.clearHistory);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between px-1">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Watch History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {history.length} video{history.length === 1 ? "" : "s"} watched
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all watch history?")) clearHistory();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" /> Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No videos watched yet.</p>
          <Link
            to="/"
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start exploring
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={`${h.id}-${h.watchedAt}`}>
              <Link
                to="/watch"
                search={{ v: h.id }}
                className="flex gap-4 rounded-2xl bg-card p-3 shadow-soft transition-colors hover:bg-accent"
              >
                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={h.thumbnail}
                    alt={h.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(h.durationSeconds)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium text-foreground">{h.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{h.channelName}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(h.watchedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
