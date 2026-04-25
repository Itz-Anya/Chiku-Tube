import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Github,
  Send,
  Sparkles,
  Heart,
  Zap,
  Code2,
  Palette,
  Eye,
  Music2,
  ShieldCheck,
  Wand2,
} from "lucide-react";

/** Avatar that gracefully falls back to gradient initials if the remote image fails. */
function CreatorAvatar({
  src,
  name,
  accent,
}: {
  src: string;
  name: string;
  accent: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      {/* Soft colored glow using drop-shadow filter */}
      <div
        aria-hidden
        className="absolute -inset-1.5 rounded-full opacity-80 blur-md"
        style={{ background: accent }}
      />
      <div
        className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-[3px] border-background bg-muted sm:h-24 sm:w-24"
        style={{
          filter:
            "drop-shadow(0 6px 14px rgba(0,0,0,0.18)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
        }}
      >
        {!failed ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-white"
            style={{ background: accent }}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const TECH_STACK = [
  "React 19",
  "TanStack Start",
  "TypeScript",
  "Tailwind CSS v4",
  "Zustand",
  "Framer Motion",
  "Pollinations AI",
  "Vite 7",
];

const FEATURES = [
  { Icon: Eye, label: "Distraction-free", color: "text-emerald-500" },
  { Icon: Music2, label: "Audio fallback", color: "text-fuchsia-500" },
  { Icon: ShieldCheck, label: "No tracking", color: "text-sky-500" },
  { Icon: Wand2, label: "AI curated", color: "text-amber-500" },
];

const CREATORS = [
  {
    name: "Anya",
    role: "Designer & Developer",
    tag: "Frontend",
    Icon: Palette,
    accent: "linear-gradient(135deg, oklch(0.75 0.18 320), oklch(0.7 0.2 350))",
    chipBg: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
    img: "https://random-images-brown.vercel.app/anya",
    github: "https://github.com/itz-Anya",
    githubLabel: "GitHub — itz-Anya",
    telegram: "https://t.me/SylveonLab",
    telegramLabel: "Telegram — SylveonLab",
    quote: "Crafts the calm.",
  },
  {
    name: "Murali",
    role: "API Owner & Pro Coder",
    tag: "Backend",
    Icon: Code2,
    accent: "linear-gradient(135deg, oklch(0.7 0.18 50), oklch(0.65 0.2 25))",
    chipBg: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
    img: "https://itz-murali-images.vercel.app/api",
    github: "https://github.com/Itz-Murali",
    githubLabel: "GitHub — Itz-Murali",
    telegram: "https://t.me/ChikuBots",
    telegramLabel: "Telegram — ChikuBots",
    quote: "Powers the engine.",
  },
];

export function AboutModal({ open, onClose }: AboutModalProps) {
  // Lock scroll while open + ESC to close.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-md sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative my-2 w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card sm:my-8 sm:rounded-3xl"
            style={{
              filter:
                "drop-shadow(0 20px 40px rgba(0,0,0,0.25)) drop-shadow(0 8px 16px rgba(0,0,0,0.15))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-amber-400/20 px-3 pb-8 pt-5 xs:px-4 xs:pb-9 xs:pt-6 sm:px-6 sm:pb-12 sm:pt-10">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:right-4 sm:top-4 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex flex-col items-center text-center">
                <motion.img
                  src="/chiku-t.png"
                  alt="Chiku Tube"
                  initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
                  className="h-20 w-auto xs:h-24 sm:h-44"
                  style={{
                    filter:
                      "drop-shadow(0 8px 24px rgba(124,58,237,0.45)) drop-shadow(0 4px 8px rgba(124,58,237,0.25))",
                  }}
                />
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm sm:text-[11px]">
                  <Sparkles className="h-3 w-3" />
                  v1 · Calm by design
                </span>
              </div>
            </div>

            <div className="space-y-3 px-3 pb-4 pt-3 xs:space-y-4 xs:px-4 xs:pb-5 xs:pt-4 sm:space-y-5 sm:px-6 sm:pb-7 sm:pt-6">
              {/* Mission */}
              <div className="-mt-9 rounded-2xl border border-border/70 bg-background/85 p-3 backdrop-blur xs:-mt-10 xs:p-3.5 sm:-mt-12 sm:p-4">
                <p className="text-[13px] leading-relaxed text-foreground/90 sm:text-sm">
                  A clean, distraction-free video discovery app — built to{" "}
                  <span className="font-semibold text-primary">
                    reduce YouTube addiction
                  </span>{" "}
                  by replacing the infinite-scroll trap with calm, AI-curated shelves and
                  a beautiful custom player.
                </p>
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                {FEATURES.map(({ Icon, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-2 py-1.5 text-[11px] font-medium text-foreground/85 sm:flex-col sm:items-center sm:gap-1 sm:py-2 sm:text-center sm:text-[10px]"
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${color}`} />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>

              {/* Tech stack */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {TECH_STACK.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground/80 sm:px-2.5 sm:py-1 sm:text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Credits — TWO SEPARATE CARDS */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  Meet the Creators
                  <Sparkles className="ml-auto h-3.5 w-3.5 text-amber-400" />
                </h3>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {CREATORS.map((p, idx) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.08, duration: 0.35 }}
                      whileHover={{ y: -3 }}
                      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-muted/30 p-3 text-center transition-colors hover:border-primary/50 sm:p-4"
                      style={{
                        filter:
                          "drop-shadow(0 4px 12px rgba(0,0,0,0.08)) drop-shadow(0 1px 3px rgba(0,0,0,0.06))",
                      }}
                    >
                      {/* corner glow */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-80"
                        style={{ background: p.accent }}
                      />

                      <div className="relative">
                        <CreatorAvatar src={p.img} name={p.name} accent={p.accent} />

                        <p className="mt-2.5 font-display text-sm font-bold text-foreground sm:text-base">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
                          {p.role}
                        </p>

                        <span
                          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${p.chipBg}`}
                        >
                          <p.Icon className="h-2.5 w-2.5" />
                          {p.tag}
                        </span>

                        <p className="mt-2 text-[10px] italic text-foreground/60 sm:text-[11px]">
                          “{p.quote}”
                        </p>

                        <div className="mt-2.5 flex items-center justify-center gap-1.5">
                          <a
                            href={p.github}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={p.githubLabel}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Github className="h-3 w-3" />
                          </a>
                          <a
                            href={p.telegram}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={p.telegramLabel}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-[#229ED9] transition-all hover:-translate-y-0.5 hover:border-[#229ED9] hover:bg-[#229ED9] hover:text-white"
                          >
                            <Send className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Thank you strip */}
              <div className="rounded-2xl border border-dashed border-border/70 bg-gradient-to-r from-primary/5 via-fuchsia-500/5 to-amber-400/5 px-3 py-2.5 text-center">
                <p className="text-[11px] text-foreground/75 sm:text-xs">
                  Thanks for using <span className="font-semibold text-foreground">Chiku Tube</span> —
                  share it with a friend who scrolls too much. 💜
                </p>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Made with{" "}
                <Heart className="inline h-3 w-3 fill-rose-500 text-rose-500" /> to help
                you watch less, enjoy more.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
