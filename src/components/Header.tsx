import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, X, Moon, Sun, Home, History, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useChiku } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AboutModal } from "./AboutModal";
import { LanguageSelector } from "./LanguageSelector";

export function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [aboutOpen, setAboutOpen] = useState(false);
  const theme = useChiku((s) => s.theme);
  const toggleTheme = useChiku((s) => s.toggleTheme);

  // Sync html class with persisted theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate({ to: "/search", search: { q: trimmed } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="About Chiku Tube"
        >
          <img
            src="/chiku-t.png"
            alt="Chiku Tube"
            className="h-7 w-auto sm:h-9"
          />
        </button>
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              aria-label="Search videos"
              className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-9 text-sm text-foreground shadow-soft outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:h-11 sm:pl-11 sm:pr-11"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        <LanguageSelector className="shrink-0" />

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-accent"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

export function SideRail() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/history", label: "History", icon: History },
    { to: "/liked", label: "Liked", icon: Heart },
  ] as const;

  return (
    <nav className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 flex flex-col gap-1 p-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileTabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/", label: "Home", icon: Home },
    { to: "/history", label: "History", icon: History },
    { to: "/liked", label: "Liked", icon: Heart },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
