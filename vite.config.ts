// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Lovable preset defaults nitro to cloudflare-module, so a plain Vercel
// build would emit a Cloudflare Worker bundle. Opt into the Vercel preset
// whenever Vercel runs the build (an explicit NITRO_PRESET still wins).
if (process.env["VERCEL"] && !process.env["NITRO_PRESET"]) {
  process.env["NITRO_PRESET"] = "vercel";
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
