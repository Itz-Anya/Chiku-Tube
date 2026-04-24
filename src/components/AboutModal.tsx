import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, Send, Sparkles, Heart, Zap } from "lucide-react";

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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-md sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elevated sm:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-amber-400/20 px-5 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:right-4 sm:top-4"
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
                  className="h-32 w-auto drop-shadow-[0_8px_24px_rgba(124,58,237,0.45)] sm:h-44"
                />
                
              </div>
            </div>

            <div className="space-y-5 px-5 pb-6 pt-5 sm:space-y-6 sm:px-6 sm:pb-7 sm:pt-6">
              {/* Mission */}
              <div className="-mt-12 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-soft backdrop-blur">
                <p className="text-sm leading-relaxed text-foreground/90">
                  A clean, distraction-free video discovery app — built to{" "}
                  <span className="font-semibold text-primary">reduce YouTube addiction</span>{" "}
                  by replacing the infinite-scroll trap with calm, AI-curated shelves and a
                  beautiful custom player.
                </p>
              </div>

              {/* Tech stack */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_STACK.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Created by Anya */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 to-transparent p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                  Created by
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400 opacity-80 blur-[2px]" />
                    <img
                      src="https://itz-murali-images.vercel.app/anya"
                      alt="Anya"
                      className="relative h-14 w-14 rounded-full border-2 border-background object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold text-foreground">Anya</p>
                    <p className="text-xs text-muted-foreground">Designer & developer</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://github.com/itz-Anya"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="GitHub — itz-Anya"
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground hover:shadow-elevated"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    <a
                      href="https://t.me/SylveonLab"
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Telegram — SylveonLab"
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-[#229ED9] transition-all hover:-translate-y-0.5 hover:border-[#229ED9] hover:bg-[#229ED9] hover:text-white hover:shadow-elevated"
                    >
                      <Send className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                Made with <Heart className="inline h-3 w-3 fill-rose-500 text-rose-500" /> to help
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
