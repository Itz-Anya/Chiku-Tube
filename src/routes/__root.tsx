import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header, SideRail, MobileTabBar } from "@/components/Header";
import { PlayerHost } from "@/components/PlayerHost";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Back to Chiku Tube
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { httpEquiv: "X-UA-Compatible", content: "IE=edge" },
      { name: "theme-color", content: "#7C3AED" },
      { name: "color-scheme", content: "light dark" },
      { title: "Chiku Tube — Watch what matters, not what's trending" },
      {
        name: "description",
        content:
          "Chiku Tube is your escape from the algorithm — a beautifully minimal video discovery platform powered by AI-curated shelves. No endless scrolling, no rage bait, no burnout. Just handpicked content you'll actually love, served through a gorgeous custom player designed for focus and joy.",
      },
      {
        name: "keywords",
        content:
          "chiku tube, distraction-free youtube, ai video recommendations, mindful video watching, minimal video player, curated video discovery, reduce screen time, youtube alternative, calm video app, intentional watching",
      },
      { name: "author", content: "Anya" },
      { name: "creator", content: "Anya" },
      { name: "publisher", content: "Chiku Tube" },
      { name: "copyright", content: "Chiku Tube" },
      { name: "rating", content: "general" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },

      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "bingbot", content: "index, follow" },
      { name: "google", content: "notranslate" },
      { name: "google-site-verification", content: "" },

      { name: "application-name", content: "Chiku Tube" },
      { name: "apple-mobile-web-app-title", content: "Chiku Tube" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { name: "HandheldFriendly", content: "true" },
      { name: "MobileOptimized", content: "320" },

      { name: "msapplication-TileColor", content: "#7C3AED" },
      { name: "msapplication-TileImage", content: "/chiku.png" },
      { name: "msapplication-config", content: "/browserconfig.xml" },
      { name: "msapplication-tap-highlight", content: "no" },

      { property: "og:site_name", content: "Chiku Tube" },
      { property: "og:title", content: "Chiku Tube — Watch what matters, not what's trending" },
      {
        property: "og:description",
        content:
          "Break free from the algorithm. Chiku Tube delivers AI-curated video shelves in a clean, distraction-free player — so every watch feels intentional, not accidental.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://chiku-tube.vercel.app" },
      { property: "og:image", content: "https://chiku-tube.vercel.app/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://chiku-tube.vercel.app/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Chiku Tube — distraction-free video discovery, beautifully designed" },
      { property: "og:locale", content: "en_US" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@itzAnya" },
      { name: "twitter:creator", content: "@itzAnya" },
      { name: "twitter:title", content: "Chiku Tube — Watch what matters, not what's trending" },
      {
        name: "twitter:description",
        content:
          "AI-curated video shelves. A minimal, gorgeous player. Zero rage bait. Chiku Tube is the mindful way to watch.",
      },
      { name: "twitter:image", content: "https://chiku-tube.vercel.app/og-image.jpg" },
      { name: "twitter:image:alt", content: "Chiku Tube — distraction-free video discovery, beautifully designed" },

      { name: "pinterest", content: "nopin" },
      { name: "pinterest-rich-pin", content: "true" },

      { property: "fb:app_id", content: "" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://chiku-tube.vercel.app/" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", href: "/chiku.png" },
      { rel: "shortcut icon", type: "image/png", href: "/chiku.png" },
      { rel: "apple-touch-icon", href: "/chiku.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/chiku.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/chiku.png" },
      { rel: "mask-icon", href: "/chiku.png", color: "#7C3AED" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Chiku Tube",
          description:
            "A beautifully minimal, distraction-free video discovery platform powered by AI-curated shelves. Designed to help you watch less, enjoy more, and reclaim your attention from the algorithm.",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: {
            "@type": "Person",
            name: "Anya",
            url: "https://github.com/itz-Anya",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto flex max-w-[1600px] gap-2 px-2 sm:px-4">
        <SideRail />
        <main className="min-w-0 flex-1 pb-24 pt-6 lg:pb-12">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <PlayerHost />
    </div>
  );
}



