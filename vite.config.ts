import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Build for Vercel when VERCEL env is set, otherwise produce the default
// Cloudflare-compatible build that Lovable's preview sandbox expects.
const isVercel = !!process.env.VERCEL;

export default isVercel
  ? defineConfig({
      cloudflare: false,
      vite: { plugins: [nitro({ preset: "vercel" })] },
    })
  : defineConfig({});
