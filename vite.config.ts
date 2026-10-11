/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Libraries go into their own long-cached files; our code changes more
        // often, so a new release only re-downloads the app chunk.
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            { name: "router", test: /node_modules[\\/]react-router[\\/]/, priority: 30 },
            { name: "query", test: /node_modules[\\/]@tanstack[\\/]/, priority: 30 },
            {
              name: "ui",
              test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui)[\\/]/,
              priority: 20,
            },
            // The mock API is loaded on demand (src/main.tsx), so keep it out of
            // the shared chunk that every page downloads.
            {
              name: "mocks",
              test: /node_modules[\\/](msw|@msw|@mswjs|@inquirer|cookie|headers-polyfill|is-node-process|outvariant|rettime|tough-cookie|tldts|tldts-core|until-async|@open-draft|strict-event-emitter)[\\/]/,
              priority: 25,
            },
            {
              name: "forms",
              test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/,
              priority: 20,
            },
            { name: "vendor", test: /node_modules[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/shared/ui/**", "src/shared/mocks/**", "src/test/**"],
    },
  },
});
