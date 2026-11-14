import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    // Readable output: the bundle is small and easier to debug in the browser.
    minify: false,
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
