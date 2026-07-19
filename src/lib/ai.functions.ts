import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const POLLINATIONS_URL = "https://gen.pollinations.ai/v1/chat/completions";
const POLLINATIONS_KEY = "sk_rmm3GowH01RRxIzoDYBVCnpL0O5OerhP";
const POLLINATIONS_MODEL = "mistral";

function buildKeywordFallbackFromTitles(titles: string[]): string[] {
  const cleaned = titles
    .map((title) => title.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const phrases = new Set<string>();
  for (const title of cleaned) {
    phrases.add(title);

    const primary = title
      .split(/\s[-|–—]\s/)[0]
      ?.replace(/[\[\](){}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (primary && primary.length >= 3) phrases.add(primary);

    const compact = title
      .replace(/official|video|lyrics|playlist|song|songs|music|full|best/gi, " ")
      .replace(/[\[\](){}|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (compact && compact.length >= 3) phrases.add(compact);
  }

  return Array.from(phrases)
    .map((phrase) => phrase.slice(0, 80).trim())
    .filter((phrase) => phrase.length >= 3)
    .slice(0, 6);
}

/**
 * Parse keywords from a free-form text response.
 * Supports JSON arrays, JSON objects with a "keywords" field, numbered/bulleted lists,
 * and comma-separated lines.
 */
function parseKeywordsFromText(content: string): string[] {
  const trimmed = content.trim();

  // Try direct JSON first.
  const tryJson = (raw: string): string[] | null => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s: unknown): s is string => typeof s === "string");
      }
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as { keywords?: unknown }).keywords)) {
        return (parsed as { keywords: unknown[] }).keywords.filter(
          (s): s is string => typeof s === "string",
        );
      }
    } catch {
      // ignore
    }
    return null;
  };

  const direct = tryJson(trimmed);
  if (direct && direct.length > 0) return cleanList(direct);

  // Try to extract JSON from inside the text.
  const arrMatch = trimmed.match(/\[[\s\S]*?\]/);
  if (arrMatch) {
    const fromArr = tryJson(arrMatch[0]);
    if (fromArr && fromArr.length > 0) return cleanList(fromArr);
  }
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) {
    const fromObj = tryJson(objMatch[0]);
    if (fromObj && fromObj.length > 0) return cleanList(fromObj);
  }

  // Fallback: split lines / commas, strip list markers.
  const lines = trimmed
    .split(/[\n,]/)
    .map((s) => s.replace(/^[\s\d.\-*•"'`]+/, "").replace(/["'`]+$/, "").trim())
    .filter((s) => s.length >= 3 && s.length <= 80 && !/^[\d.\s]*$/.test(s));

  return cleanList(lines);
}

function cleanList(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = raw.replace(/^["'`]+|["'`]+$/g, "").trim();
    if (v.length < 3 || v.length > 80) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

async function callPollinationsOnce(systemPrompt: string, userPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POLLINATIONS_KEY}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        model: POLLINATIONS_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("Pollinations error", res.status, t.slice(0, 200));
      throw new Error(`AI error ${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  } finally {
    clearTimeout(timeout);
  }
}

async function callAIForKeywords(systemPrompt: string, userPrompt: string): Promise<string[]> {
  // Nudge the model to return JSON so parsing is reliable.
  const sys = `${systemPrompt}\n\nIMPORTANT: Respond ONLY with a JSON array of strings, no prose, no code fences. Example: ["phrase one","phrase two"]`;

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callPollinationsOnce(sys, userPrompt);
      const keywords = parseKeywordsFromText(text);
      if (keywords.length > 0) return keywords;
      lastErr = new Error("Empty AI response");
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

/** Generate themed shelves for the home feed. */
export const generateHomeShelves = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { seed?: number; avoid?: string[] }) =>
      z
        .object({
          seed: z.number().optional(),
          avoid: z.array(z.string()).max(30).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const avoid = data.avoid?.join(", ") || "none";
    const seed = data.seed ?? Math.floor(Math.random() * 10000);
    try {
      const keywords = await callAIForKeywords(
        "You design a YouTube-style discovery feed. Return diverse, evergreen-but-fresh search keyword phrases that would yield interesting watchable videos. Mix genres: music, tech, science, lofi, gaming, cooking, documentaries, comedy, learning, podcasts, travel. Each keyword should be 2–5 words, suitable for a YouTube search. Avoid duplicating recently used ones.",
        `Return exactly 6 themed search phrases. Seed: ${seed}. Avoid these recent ones: ${avoid}.`,
      );
      return { shelves: keywords.slice(0, 6), error: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const fallback = [
        "lofi hip hop radio",
        "ambient piano music",
        "nature documentary 4k",
        "indie game soundtracks",
        "minimalist tech reviews",
        "street food tour",
      ];
      return { shelves: fallback, error: msg };
    }
  });

/** Generate related-video search keywords from a current video's metadata. */
export const generateRelatedKeywords = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { title: string; channel?: string }) =>
      z
        .object({
          title: z.string().min(1).max(500),
          channel: z.string().max(200).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const keywords = await callAIForKeywords(
        "You suggest related YouTube searches. CRITICAL: ALWAYS match the language, script, region, and cultural context of the input title. If the title is in Kannada/Hindi/Tamil/Telugu/Spanish/Korean/Japanese/etc., return search phrases IN THAT SAME LANGUAGE and culture (e.g. Kannada title → Kannada/Sandalwood phrases; K-pop title → Korean phrases). Never default to English. Return 4 short, varied phrases (2–5 words). Mix close-related and tangential picks within the same language/genre.",
        `Title: ${data.title}\nChannel: ${data.channel || "unknown"}\n\nReturn 4 related YouTube search phrases in the SAME language as the title.`,
      );
      return { keywords: keywords.slice(0, 4), error: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      const words = data.title
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 3);
      const fallback = [data.title.slice(0, 40), data.channel || "music", words.join(" ")].filter(
        Boolean,
      );
      return { keywords: fallback, error: msg };
    }
  });

/** Rank curated shelf titles based on recent watch history. */
export const rankShelvesForUser = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { recentTitles: string[]; shelfTitles: string[] }) =>
      z
        .object({
          recentTitles: z.array(z.string().max(300)).max(15),
          shelfTitles: z.array(z.string().max(80)).min(1).max(20),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.recentTitles.length === 0) {
      return { ordered: data.shelfTitles, error: null as string | null };
    }
    try {
      const sys =
        "You personalize a video discovery feed. Given a user's recent watch history and a list of shelf categories, return the shelf titles re-ordered with the most relevant first. Consider language, genre, and topic of the user's taste. Use ONLY the provided shelf titles — do not invent new ones, do not omit any. Respond ONLY with a JSON array of strings (the shelf titles in order), no prose, no code fences.";
      const user = `Recently watched & liked:\n${data.recentTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nAvailable shelves: ${JSON.stringify(data.shelfTitles)}\n\nReturn the shelves ordered by relevance as a JSON array.`;
      const text = await callPollinationsOnce(sys, user);
      const aiOrder = parseKeywordsFromText(text);
      const valid = aiOrder.filter((t) => data.shelfTitles.includes(t));
      const missing = data.shelfTitles.filter((t) => !valid.includes(t));
      return { ordered: [...valid, ...missing], error: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { ordered: data.shelfTitles, error: msg };
    }
  });

/** Generate "Because you watched..." keywords from recent watch history. */
export const generateBecauseYouWatched = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      recentTitles: string[];
      likedTitles?: string[];
      language?: string;
      region?: string;
    }) =>
      z
        .object({
          recentTitles: z.array(z.string().max(300)).max(10),
          likedTitles: z.array(z.string().max(300)).max(10).optional(),
          language: z.string().max(40).optional(),
          region: z.string().max(80).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.recentTitles.length === 0 && (data.likedTitles ?? []).length === 0) {
      return { keywords: [], error: null as string | null };
    }
    const fallback = buildKeywordFallbackFromTitles([
      ...(data.likedTitles ?? []),
      ...data.recentTitles,
    ]);
    const langHint = data.language && data.language !== "global" && data.language !== "en"
      ? `\n\nUSER REGION: ${data.region || "unknown"}\nPREFERRED LANGUAGE: ${data.language}\nIMPORTANT: Bias ~60% of phrases toward this language/region (e.g. local creators, regional music, native-script titles). Keep ~40% global / cross-language so the feed never feels restricted.`
      : "";
    try {
      const liked = data.likedTitles ?? [];
      const keywords = await callAIForKeywords(
        "You generate YouTube search phrases that match a user's taste. CRITICAL: ALWAYS match the language and culture of the input titles. If titles are in Kannada/Hindi/Tamil/Telugu/Spanish/Korean/Japanese/etc., return phrases IN THAT SAME LANGUAGE/SCRIPT and culture. Liked videos signal stronger preference than watched. Return diverse, specific phrases (2–5 words each) — mix close picks and tangential discoveries.",
        `LIKED (high signal):\n${liked.length === 0 ? "(none)" : liked.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nWATCHED (medium signal):\n${data.recentTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}${langHint}\n\nReturn 6 YouTube search phrases.`,
      );
      return {
        keywords: (keywords.length > 0 ? keywords : fallback).slice(0, 6),
        error: null as string | null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { keywords: fallback, error: msg };
    }
  });

/** Generate fresh, on-trend YouTube search phrases for a "Trending Now" shelf. */
export const generateTrendingNow = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { hint?: string; language?: string; region?: string }) =>
      z
        .object({
          hint: z.string().max(200).optional(),
          language: z.string().max(40).optional(),
          region: z.string().max(80).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const seed = Math.floor(Math.random() * 100000);
      const langHint = data.language && data.language !== "global" && data.language !== "en"
        ? `\nUSER REGION: ${data.region || "unknown"} — bias ~60% trends toward ${data.language} (local music, regional creators, native script). Keep ~40% global hits.`
        : "";
      const keywords = await callAIForKeywords(
        "You suggest currently popular YouTube search phrases people would want to watch right now. Mix music drops, viral clips, popular creators, sports highlights, gaming, tech news. Each phrase: 2–5 words. No duplicates.",
        `Hint about user taste: ${data.hint || "general audience"}${langHint}\nSeed: ${seed}\n\nReturn 5 trending YouTube search phrases.`,
      );
      return { keywords: keywords.slice(0, 5), error: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return { keywords: [], error: msg };
    }
  });
