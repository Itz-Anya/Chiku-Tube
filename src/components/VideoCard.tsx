import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Video } from "@/lib/api";
import { formatDuration, isBroken } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  video: Video;
  index?: number;
  size?: "sm" | "md";
}

export function VideoCard({ video, index = 0, size = "md" }: VideoCardProps) {
  const [loaded, setLoaded] = useState(false);

  // Skip rendering if the video has been marked as unplayable.
  if (isBroken(video.id)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      className="group"
    >
      <Link
        to="/watch"
        search={{ v: video.id }}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-muted shadow-soft transition-shadow group-hover:shadow-elevated",
            size === "md" ? "aspect-video" : "aspect-video",
          )}
        >
          {!loaded && <div className="thumb-blur absolute inset-0" />}
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-500",
              loaded ? "opacity-100" : "opacity-0",
              "group-hover:scale-[1.03]",
            )}
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
            {formatDuration(video.durationSeconds)}
          </div>
        </div>
        <div className="mt-3 px-1">
          <h3
            className={cn(
              "line-clamp-2 font-medium leading-snug text-foreground transition-colors group-hover:text-primary",
              size === "md" ? "text-[15px]" : "text-sm",
            )}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{video.channelName}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-2xl">
        <div className="thumb-blur h-full w-full" />
      </div>
      <div className="mt-3 space-y-2 px-1">
        <div className="thumb-blur h-4 w-[90%] rounded" />
        <div className="thumb-blur h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}
