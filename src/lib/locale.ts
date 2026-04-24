// Smart location-based language hints.
// Uses a free IP geolocation API (no key required). Fails gracefully —
// when detection is unavailable we just show the global default mix.

export interface DetectedLocation {
  countryCode: string; // ISO 3166-1 alpha-2 (e.g. "IN", "US")
  countryName: string;
  region: string; // state/province (e.g. "Karnataka")
  city: string;
  /** Suggested primary language code (BCP-47-ish, e.g. "kn", "hi", "en"). */
  language: string;
  /** Human-readable language name (e.g. "Kannada"). */
  languageName: string;
}

/** Curated language catalog for the manual selector. */
export const LANGUAGE_OPTIONS: Array<{ code: string; name: string; native: string }> = [
  { code: "auto", name: "Auto-detect", native: "Auto" },
  { code: "global", name: "Global mix", native: "Global" },
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "ja", name: "Japanese", native: "日本語" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "id", name: "Indonesian", native: "Indonesia" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "ru", name: "Russian", native: "Русский" },
];

/** India: map state → primary regional language. Falls back to Hindi. */
const INDIA_STATE_TO_LANG: Record<string, { code: string; name: string }> = {
  karnataka: { code: "kn", name: "Kannada" },
  "tamil nadu": { code: "ta", name: "Tamil" },
  tamilnadu: { code: "ta", name: "Tamil" },
  kerala: { code: "ml", name: "Malayalam" },
  "andhra pradesh": { code: "te", name: "Telugu" },
  telangana: { code: "te", name: "Telugu" },
  maharashtra: { code: "mr", name: "Marathi" },
  goa: { code: "mr", name: "Marathi" },
  "west bengal": { code: "bn", name: "Bengali" },
  tripura: { code: "bn", name: "Bengali" },
  gujarat: { code: "gu", name: "Gujarati" },
  punjab: { code: "pa", name: "Punjabi" },
  haryana: { code: "hi", name: "Hindi" },
  delhi: { code: "hi", name: "Hindi" },
  "uttar pradesh": { code: "hi", name: "Hindi" },
  "madhya pradesh": { code: "hi", name: "Hindi" },
  rajasthan: { code: "hi", name: "Hindi" },
  bihar: { code: "hi", name: "Hindi" },
  jharkhand: { code: "hi", name: "Hindi" },
  uttarakhand: { code: "hi", name: "Hindi" },
  "himachal pradesh": { code: "hi", name: "Hindi" },
  chhattisgarh: { code: "hi", name: "Hindi" },
  odisha: { code: "hi", name: "Hindi" }, // Oriya not in selector; default to hi
  assam: { code: "hi", name: "Hindi" },
};

/** Country → primary language. Used when no finer regional rule matches. */
const COUNTRY_TO_LANG: Record<string, { code: string; name: string }> = {
  IN: { code: "hi", name: "Hindi" },
  US: { code: "en", name: "English" },
  GB: { code: "en", name: "English" },
  CA: { code: "en", name: "English" },
  AU: { code: "en", name: "English" },
  NZ: { code: "en", name: "English" },
  IE: { code: "en", name: "English" },
  ES: { code: "es", name: "Spanish" },
  MX: { code: "es", name: "Spanish" },
  AR: { code: "es", name: "Spanish" },
  CO: { code: "es", name: "Spanish" },
  CL: { code: "es", name: "Spanish" },
  PE: { code: "es", name: "Spanish" },
  BR: { code: "pt", name: "Portuguese" },
  PT: { code: "pt", name: "Portuguese" },
  FR: { code: "fr", name: "French" },
  BE: { code: "fr", name: "French" },
  CH: { code: "de", name: "German" },
  DE: { code: "de", name: "German" },
  AT: { code: "de", name: "German" },
  JP: { code: "ja", name: "Japanese" },
  KR: { code: "ko", name: "Korean" },
  CN: { code: "zh", name: "Chinese" },
  TW: { code: "zh", name: "Chinese" },
  HK: { code: "zh", name: "Chinese" },
  SA: { code: "ar", name: "Arabic" },
  AE: { code: "ar", name: "Arabic" },
  EG: { code: "ar", name: "Arabic" },
  ID: { code: "id", name: "Indonesian" },
  TR: { code: "tr", name: "Turkish" },
  RU: { code: "ru", name: "Russian" },
  PK: { code: "ur", name: "Urdu" },
  BD: { code: "bn", name: "Bengali" },
};

function pickLangForLocation(country: string, region: string): { code: string; name: string } {
  if (country === "IN") {
    const key = region.toLowerCase().trim();
    if (INDIA_STATE_TO_LANG[key]) return INDIA_STATE_TO_LANG[key];
  }
  return COUNTRY_TO_LANG[country] || { code: "en", name: "English" };
}

/** Detect coarse location via a free public IP geo service. */
export async function detectLocation(signal?: AbortSignal): Promise<DetectedLocation | null> {
  // ipwho.is is keyless, CORS-friendly, and returns rich data.
  try {
    const res = await fetch("https://ipwho.is/", { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      success?: boolean;
      country_code?: string;
      country?: string;
      region?: string;
      city?: string;
    };
    if (data.success === false || !data.country_code) return null;
    const country = data.country_code.toUpperCase();
    const region = data.region || "";
    const lang = pickLangForLocation(country, region);
    return {
      countryCode: country,
      countryName: data.country || country,
      region,
      city: data.city || "",
      language: lang.code,
      languageName: lang.name,
    };
  } catch {
    return null;
  }
}

/** Build a small set of search modifiers for a language. Used to bias queries. */
export function languageSearchModifiers(lang: string): string[] {
  switch (lang) {
    case "hi":
      return ["hindi songs", "bollywood", "hindi vlog", "हिंदी"];
    case "kn":
      return ["kannada songs", "sandalwood", "kannada movie scene", "ಕನ್ನಡ"];
    case "ta":
      return ["tamil songs", "kollywood", "tamil vlog", "தமிழ்"];
    case "te":
      return ["telugu songs", "tollywood", "telugu vlog", "తెలుగు"];
    case "ml":
      return ["malayalam songs", "mollywood", "malayalam vlog", "മലയാളം"];
    case "mr":
      return ["marathi songs", "marathi movie", "मराठी"];
    case "bn":
      return ["bengali songs", "bangla movie", "বাংলা"];
    case "gu":
      return ["gujarati songs", "ગુજરાતી"];
    case "pa":
      return ["punjabi songs", "punjabi vlog", "ਪੰਜਾਬੀ"];
    case "ur":
      return ["urdu poetry", "pakistani drama", "اردو"];
    case "es":
      return ["música en español", "reggaeton", "vlog en español"];
    case "pt":
      return ["música brasileira", "vlog brasil", "sertanejo"];
    case "fr":
      return ["musique française", "vlog français"];
    case "de":
      return ["deutsche musik", "vlog deutsch"];
    case "ja":
      return ["j-pop", "anime music", "日本"];
    case "ko":
      return ["k-pop", "korean vlog", "한국"];
    case "zh":
      return ["中文歌曲", "chinese vlog"];
    case "ar":
      return ["أغاني عربية", "arabic music"];
    case "id":
      return ["lagu indonesia", "vlog indonesia"];
    case "tr":
      return ["türkçe müzik", "vlog türkiye"];
    case "ru":
      return ["русская музыка", "vlog russia"];
    case "en":
    case "global":
    default:
      return [];
  }
}

export function languageDisplayName(code: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.code === code)?.name ?? code;
}
