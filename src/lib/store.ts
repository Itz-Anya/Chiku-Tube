import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Video } from "./api";

export interface HistoryItem {
  id: string;
  title: string;
  channelName: string;
  thumbnail: string;
  youtubeUrl: string;
  durationSeconds: number;
  watchedAt: number;
  watchedSeconds: number;
}

export type PlayerMode = "hidden" | "full" | "mini";

export interface PlayerState {
  video: Video | null;
  mode: PlayerMode;
  position: number;
  /** Bumped to force the host to refetch the stream URL (e.g. on expiry). */
  refetchKey: number;
}

export interface DetectedLocationLite {
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  language: string;
  languageName: string;
}

interface ChikuState {
  theme: "light" | "dark";
  history: HistoryItem[];
  liked: HistoryItem[];
  player: PlayerState;
  /** User's language preference. "auto" → use detected location. "global" → no bias. */
  languagePref: string;
  /** Detected location (cached so we don't re-fetch on every visit). */
  detectedLocation: DetectedLocationLite | null;
  /** Timestamp of last successful detection. */
  detectedAt: number;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setLanguagePref: (lang: string) => void;
  setDetectedLocation: (loc: DetectedLocationLite | null) => void;
  pushHistory: (item: Omit<HistoryItem, "watchedAt">) => void;
  clearHistory: () => void;
  toggleLike: (item: Omit<HistoryItem, "watchedAt" | "watchedSeconds">) => void;
  isLiked: (id: string) => boolean;
  /** Load a video into the global player in fullscreen "watch" mode. */
  playVideo: (v: Video) => void;
  /** Update transient player state (position, mode, etc). */
  setPlayer: (m: Partial<PlayerState>) => void;
  /** Stop and unload the active video. */
  closePlayer: () => void;
  /** Force the host to refetch the current video's stream URL. */
  refetchStream: () => void;
}

export const useChiku = create<ChikuState>()(
  persist(
    (set, get) => ({
      theme: "light",
      history: [],
      liked: [],
      player: { video: null, mode: "hidden", position: 0, refetchKey: 0 },
      languagePref: "auto",
      detectedLocation: null,
      detectedAt: 0,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setLanguagePref: (languagePref) => set({ languagePref }),
      setDetectedLocation: (detectedLocation) =>
        set({ detectedLocation, detectedAt: detectedLocation ? Date.now() : 0 }),
      pushHistory: (item) => {
        const watchedAt = Date.now();
        const filtered = get().history.filter((h) => h.id !== item.id);
        set({ history: [{ ...item, watchedAt }, ...filtered].slice(0, 100) });
      },
      clearHistory: () => set({ history: [] }),
      toggleLike: (item) => {
        const exists = get().liked.find((l) => l.id === item.id);
        if (exists) {
          set({ liked: get().liked.filter((l) => l.id !== item.id) });
        } else {
          set({
            liked: [{ ...item, watchedAt: Date.now(), watchedSeconds: 0 }, ...get().liked],
          });
        }
      },
      isLiked: (id) => get().liked.some((l) => l.id === id),
      playVideo: (v) => {
        const cur = get().player;
        // Same video already loaded → keep position, just switch to full mode.
        if (cur.video?.id === v.id) {
          set({ player: { ...cur, mode: "full" } });
          return;
        }
        set({ player: { video: v, mode: "full", position: 0, refetchKey: 0 } });
      },
      setPlayer: (m) => set({ player: { ...get().player, ...m } }),
      closePlayer: () =>
        set({ player: { video: null, mode: "hidden", position: 0, refetchKey: 0 } }),
      refetchStream: () =>
        set({ player: { ...get().player, refetchKey: get().player.refetchKey + 1 } }),
    }),
    {
      name: "chiku-tube-v1",
      partialize: (s) => ({
        theme: s.theme,
        history: s.history,
        liked: s.liked,
        languagePref: s.languagePref,
        detectedLocation: s.detectedLocation,
        detectedAt: s.detectedAt,
      }),
    },
  ),
);

/** Apply persisted theme to <html>. Call once on mount. */
export function useApplyTheme() {
  const theme = useChiku((s) => s.theme);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}
