import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown, MapPin } from "lucide-react";
import { useChiku } from "@/lib/store";
import { detectLocation } from "@/lib/locale";
import { LANGUAGE_OPTIONS } from "@/lib/locale";
import { cn } from "@/lib/utils";

const DETECT_TTL_MS = 24 * 60 * 60 * 1000; // re-detect once a day

/** Floating language picker. Detects location on first load, persists choice. */
export function LanguageSelector({ className }: { className?: string }) {
  const languagePref = useChiku((s) => s.languagePref);
  const setLanguagePref = useChiku((s) => s.setLanguagePref);
  const detectedLocation = useChiku((s) => s.detectedLocation);
  const detectedAt = useChiku((s) => s.detectedAt);
  const setDetectedLocation = useChiku((s) => s.setDetectedLocation);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect location once per day. Fails silently → fallback global feed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fresh = detectedAt && Date.now() - detectedAt < DETECT_TTL_MS;
    if (fresh && detectedLocation) return;
    const ctl = new AbortController();
    detectLocation(ctl.signal)
      .then((loc) => {
        if (loc) setDetectedLocation(loc);
      })
      .catch(() => {
        /* offline / blocked → silent */
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LANGUAGE_OPTIONS.find((o) => o.code === languagePref) ?? LANGUAGE_OPTIONS[0];
  const effective =
    languagePref === "auto" ? detectedLocation?.languageName ?? "Global" : current.native;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose content language"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground shadow-soft transition-colors hover:bg-accent sm:text-sm"
      >
        <Globe className="h-4 w-4 shrink-0 text-primary" />
        <span className="max-w-[80px] truncate sm:max-w-[140px]">{effective}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-elevated">
          {detectedLocation && (
            <div className="flex items-start gap-2 border-b border-border/60 bg-accent/40 px-3 py-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="min-w-0 text-xs">
                <p className="truncate font-medium text-foreground">
                  {detectedLocation.region
                    ? `${detectedLocation.region}, ${detectedLocation.countryName}`
                    : detectedLocation.countryName}
                </p>
                <p className="text-muted-foreground">
                  Suggested: {detectedLocation.languageName}
                </p>
              </div>
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto py-1">
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = opt.code === languagePref;
              return (
                <li key={opt.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguagePref(opt.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent",
                      active && "bg-accent/60",
                    )}
                  >
                    <span className="flex flex-col items-start text-left">
                      <span className="font-medium text-foreground">{opt.native}</span>
                      {opt.code !== "auto" && opt.code !== "global" && opt.native !== opt.name && (
                        <span className="text-[11px] text-muted-foreground">{opt.name}</span>
                      )}
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
            We mix regional + global picks — your feed is never restricted.
          </p>
        </div>
      )}
    </div>
  );
}
