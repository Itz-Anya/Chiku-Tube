// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// When building on Vercel, swap the Cloudflare Worker output for a Vercel
// serverless build. Locally / on Lovable Cloud we keep the default Cloudflare
// preset so `dist/` is produced (required by the platform's dist-check).
const isVercel = !!process.env.VERCEL;

export default isVercel
  ? defineConfig({
      cloudflare: false,
      vite: { plugins: [nitro({ preset: "vercel" })] },
    })
  : defineConfig({});
