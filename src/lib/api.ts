// Chiku Tube API client — wraps the public YouTube proxy.
// Endpoints:
//   GET /YouTube?query=...&limit=1-20  -> Video[]   (gives title/channel/thumb but no streams)
//   GET /Url?url=<youtube_url>          -> Video (with audioUrl/videoUrl, but channel often "Unknown")

export const API_BASE = "https://youtube-api.itz-murali.workers.dev";

export interface ApiVideo {
  thumbnail: string;
  title: string;
  duration: string; // seconds, as string. "0" for live
  channelName: string;
  audioUrl?: string | null;
  videoUrl?: string | null;
  credits?: string;
}

export interface Video extends ApiVideo {
  /** Stable id derived from the YouTube video id in the thumbnail or stream URL. */
  id: string;
  /** Reconstructed canonical YouTube URL (used for /Url lookups + history keys). */
  youtubeUrl?: string;
  durationSeconds: number;
  isLive: boolean;
}

function extractVideoId(v: ApiVideo): string {
  const thumbMatch = v.thumbnail?.match(/\/vi\/([a-zA-Z0-9_-]{6,})\//);
  if (thumbMatch) return thumbMatch[1];
  const stream = v.videoUrl || v.audioUrl || "";
  const idMatch = stream.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1].split(".")[0];
  return btoa(unescape(encodeURIComponent(`${v.title}|${v.channelName}`)))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);
}

function deriveChannelFromTitle(title: string): string {
  const parts = title.split(/\s[-|–—]\s/);
  if (parts.length >= 2) {
    const tail = parts[parts.length - 1].trim();
    if (tail.length > 1 && tail.length < 40 && !/[()[\]]/.test(tail)) return tail;
  }
  return "YouTube";
}

function normalize(v: ApiVideo): Video {
  const id = extractVideoId(v);
  const durationSeconds = Number(v.duration) || 0;
  const rawChannel = (v.channelName || "").trim();
  const isUnknown = !rawChannel || /^unknown(\s+channel)?$/i.test(rawChannel);
  const channelName = isUnknown ? deriveChannelFromTitle(v.title || "") : rawChannel;
  return {
    ...v,
    channelName,
    id,
    durationSeconds,
    isLive: durationSeconds === 0,
    youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : undefined,
  };
}

// ---------- Caches ----------
// Module-level caches survive route transitions (back/forward) so we don't
// re-fetch search results or stream URLs unnecessarily.
const searchCache = new Map<string, Video[]>();
const streamCache = new Map<string, Video>(); // key: video id
const metaCache = new Map<string, { title: string; channelName: string; thumbnail: string }>();
const brokenIds = new Set<string>(); // ids that returned errors / no stream

function pruneBrokenFromCaches(id: string) {
  streamCache.delete(id);
  metaCache.delete(id);
  for (const [key, videos] of searchCache.entries()) {
    const filtered = videos.filter((video) => video.id !== id);
    if (filtered.length === 0) searchCache.delete(key);
    else if (filtered.length !== videos.length) searchCache.set(key, filtered);
  }
}

export function isBroken(id: string): boolean {
  return brokenIds.has(id);
}
export function markBroken(id: string): void {
  if (!id) return;
  brokenIds.add(id);
  pruneBrokenFromCaches(id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chiku:videobroken"));
  }
}
export function getCachedVideo(id: string): Video | undefined {
  return streamCache.get(id);
}

export async function searchVideos(
  query: string,
  limit = 12,
  signal?: AbortSignal,
): Promise<Video[]> {
  const cacheKey = `${query.toLowerCase()}::${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    const filtered = cached.filter((v) => !brokenIds.has(v.id));
    if (filtered.length !== cached.length) searchCache.set(cacheKey, filtered);
    return filtered;
  }

  const safeLimit = Math.max(1, Math.min(20, limit));
  const url = `${API_BASE}/YouTube?query=${encodeURIComponent(query)}&limit=${safeLimit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = (await res.json()) as ApiVideo[];
  if (!Array.isArray(data)) return [];
  const result = data.map(normalize).filter((v) => !v.isLive && !brokenIds.has(v.id));
  // Stash metadata so /Url lookups can enrich themselves later.
  for (const v of result) {
    metaCache.set(v.id, {
      title: v.title,
      channelName: v.channelName,
      thumbnail: v.thumbnail,
    });
  }
  searchCache.set(cacheKey, result);
  return result;
}

/**
 * Resolve the playable stream for a YouTube URL. Enriches the response with
 * cached metadata (from prior search results) when the API returns "Unknown
 * Channel" / generic data.
 */
export async function fetchStream(youtubeUrl: string, signal?: AbortSignal): Promise<Video> {
  const idMatch = youtubeUrl.match(/(?:v=|youtu\.be\/|\/vi\/)([a-zA-Z0-9_-]{6,})/);
  const idGuess = idMatch?.[1];

  // Cache hit by id — reuse existing stream URLs if still valid in this session.
  if (idGuess) {
    const cached = streamCache.get(idGuess);
    if (cached && (cached.videoUrl || cached.audioUrl)) return cached;
  }

  const url = `${API_BASE}/Url?url=${encodeURIComponent(youtubeUrl)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (idGuess) markBroken(idGuess);
    throw new Error(`Stream lookup failed (${res.status})`);
  }
  const data = (await res.json()) as ApiVideo;
  let video = normalize(data);

  // Enrich with metadata captured from a prior search.
  const meta = metaCache.get(video.id);
  if (meta) {
    if (!video.title || video.title === "YouTube" || video.title.length < 3) {
      video = { ...video, title: meta.title };
    }
    if (
      !video.channelName ||
      video.channelName === "YouTube" ||
      /^unknown/i.test(video.channelName)
    ) {
      video = { ...video, channelName: meta.channelName };
    }
    if (!video.thumbnail) video = { ...video, thumbnail: meta.thumbnail };
  }

  if (!video.videoUrl && !video.audioUrl) {
    markBroken(video.id);
    throw new Error("No stream available");
  }
  streamCache.set(video.id, video);
  return video;
}

/**
 * Resolve a list of YouTube video IDs in parallel using the /Url endpoint.
 * Skips live streams, broken videos, and failures silently.
 */
export async function fetchVideosByIds(
  items: { id: string; channel?: string }[],
  signal?: AbortSignal,
): Promise<Video[]> {
  const filtered = items.filter((it) => !brokenIds.has(it.id));
  const results = await Promise.all(
    filtered.map(async ({ id, channel }) => {
      try {
        const v = await fetchStream(`https://youtu.be/${id}`, signal);
        if (v.isLive) return null;
        if (
          channel &&
          (!v.channelName || v.channelName === "YouTube" || /^unknown/i.test(v.channelName))
        ) {
          return { ...v, channelName: channel };
        }
        return v;
      } catch {
        markBroken(id);
        return null;
      }
    }),
  );
  return results.filter((v): v is Video => v !== null);
}

/**
 * Search for a query and resolve playable streams for the first N results.
 * Used by AI-personalized feed: keywords → searched videos → playable.
 */
export async function searchAndResolve(
  query: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<Video[]> {
  try {
    const results = await searchVideos(query, limit, signal);
    if (results.length === 0) return [];
    const ids = results.map((v) => ({ id: v.id, channel: v.channelName }));
    return await fetchVideosByIds(ids, signal);
  } catch {
    return [];
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
