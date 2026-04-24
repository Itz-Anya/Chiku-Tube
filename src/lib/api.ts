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

// Cache of probe results: true = playable, false = broken.
const probeCache = new Map<string, boolean>();
const probeInflight = new Map<string, Promise<boolean>>();

/**
 * Probe a video URL by loading it into an off-DOM <video> element. This
 * mirrors how the actual player will consume the URL, so it correctly catches
 * expired/403/410 streams without being blocked by CORS (video tags don't
 * enforce CORS for playback).
 *
 * Resolves true if metadata loads within the timeout, false on error/timeout.
 */
function probeVideoUrl(url: string, timeoutMs = 4500): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  if (probeCache.has(url)) return Promise.resolve(probeCache.get(url)!);
  const existing = probeInflight.get(url);
  if (existing) return existing;
  if (typeof document === "undefined") return Promise.resolve(true); // SSR — skip probe

  const p = new Promise<boolean>((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.removeAttribute("src");
      try {
        el.load();
      } catch {
        /* ignore */
      }
      probeCache.set(url, ok);
      probeInflight.delete(url);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    el.onloadedmetadata = () => finish(true);
    el.onerror = () => finish(false);
    el.src = url;
  });
  probeInflight.set(url, p);
  return p;
}

/** Run probes with bounded concurrency. */
async function probeAll<T extends { videoUrl?: string | null; audioUrl?: string | null; id: string }>(
  items: T[],
  concurrency = 6,
): Promise<T[]> {
  const ok: T[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        const url = item.videoUrl || item.audioUrl || "";
        if (!url) continue;
        const playable = await probeVideoUrl(url);
        if (playable) ok.push(item);
        else markBroken(item.id);
      }
    }),
  );
  // Preserve original order
  const orderMap = new Map(items.map((x, idx) => [x.id, idx]));
  ok.sort((a, b) => (orderMap.get(a.id)! - orderMap.get(b.id)!));
  return ok;
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
  const normalized = data.map(normalize).filter((v) => !v.isLive && !brokenIds.has(v.id));
  // Stash metadata + cache stream URLs so /Url lookups can reuse them.
  for (const v of normalized) {
    metaCache.set(v.id, {
      title: v.title,
      channelName: v.channelName,
      thumbnail: v.thumbnail,
    });
    if (v.videoUrl || v.audioUrl) streamCache.set(v.id, v);
  }
  // Probe each URL — only show cards whose stream is actually playable.
  const result = await probeAll(normalized);
  searchCache.set(cacheKey, result);
  return result;
}

/**
 * Resolve the playable stream for a YouTube URL. Enriches the response with
 * cached metadata (from prior search results) when the API returns "Unknown
 * Channel" / generic data.
 */
// Backup API (audio-only). Used when the primary stream lookup fails or
// returns no playable URL. Silently ignored if the backup also fails.
const BACKUP_API_BASE = "https://dl.ycdn.devhubx.org";

interface BackupApiResponse {
  success?: boolean;
  title?: string;
  duration?: number;
  uploader?: string;
  videoId?: string;
  downloadURL?: string;
}

async function fetchBackupStream(
  youtubeUrl: string,
  signal?: AbortSignal,
): Promise<Partial<ApiVideo> & { id?: string } | null> {
  try {
    const url = `${BACKUP_API_BASE}/ytdown?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as BackupApiResponse;
    if (!data?.success || !data.downloadURL) return null;
    return {
      id: data.videoId,
      title: data.title || "",
      channelName: data.uploader || "",
      duration: String(data.duration ?? 0),
      thumbnail: data.videoId
        ? `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`
        : "",
      audioUrl: data.downloadURL,
      videoUrl: null,
    };
  } catch {
    return null;
  }
}

export async function fetchStream(
  youtubeUrl: string,
  signal?: AbortSignal,
  options?: { forceBackup?: boolean; bypassCache?: boolean },
): Promise<Video> {
  const idMatch = youtubeUrl.match(/(?:v=|youtu\.be\/|\/vi\/)([a-zA-Z0-9_-]{6,})/);
  const idGuess = idMatch?.[1];

  // Cache hit by id — reuse existing stream URLs if still valid in this session.
  // Skip cache when bypassCache or forceBackup is set (the cached URL is the
  // one that just failed in the player).
  if (idGuess && !options?.bypassCache && !options?.forceBackup) {
    const cached = streamCache.get(idGuess);
    if (cached && (cached.videoUrl || cached.audioUrl)) return cached;
  }
  if (idGuess && (options?.bypassCache || options?.forceBackup)) {
    streamCache.delete(idGuess);
  }

  const enrich = (video: Video): Video => {
    const meta = metaCache.get(video.id);
    if (!meta) return video;
    let v = video;
    if (!v.title || v.title === "YouTube" || v.title.length < 3) {
      v = { ...v, title: meta.title };
    }
    if (!v.channelName || v.channelName === "YouTube" || /^unknown/i.test(v.channelName)) {
      v = { ...v, channelName: meta.channelName };
    }
    if (!v.thumbnail) v = { ...v, thumbnail: meta.thumbnail };
    return v;
  };

  let primaryError: Error | null = null;
  let primaryVideo: Video | null = null;

  // Try primary API first (skipped when forceBackup is set).
  if (!options?.forceBackup) {
    try {
      const url = `${API_BASE}/Url?url=${encodeURIComponent(youtubeUrl)}`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = (await res.json()) as ApiVideo;
        const video = enrich(normalize(data));
        if (video.videoUrl || video.audioUrl) {
          streamCache.set(video.id, video);
          return video;
        }
        primaryVideo = video;
      } else {
        primaryError = new Error(`Stream lookup failed (${res.status})`);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
      primaryError = e as Error;
    }
  }

  // Primary failed or returned no streams → try backup (audio-only).
  const backup = await fetchBackupStream(youtubeUrl, signal);
  if (backup && backup.audioUrl) {
    const merged: ApiVideo = {
      thumbnail: primaryVideo?.thumbnail || backup.thumbnail || "",
      title: primaryVideo?.title || backup.title || "",
      duration: primaryVideo?.durationSeconds
        ? String(primaryVideo.durationSeconds)
        : backup.duration || "0",
      channelName: primaryVideo?.channelName || backup.channelName || "",
      audioUrl: backup.audioUrl,
      videoUrl: null,
    };
    const video = enrich(normalize(merged));
    streamCache.set(video.id, video);
    return video;
  }

  // Both APIs failed.
  if (idGuess) markBroken(idGuess);
  throw primaryError || new Error("No stream available");
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
